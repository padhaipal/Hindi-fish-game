"use client";

// ---------------------------------------------------------------------------
// CHAT: a WhatsApp-style conversation with the Lifteracy reading bot.
// ---------------------------------------------------------------------------
// The bot side is a small async script (see `advance`). Each bot step awaits
// its typing pause / voice note, and every await checks a generation counter
// so "restart" cancels a conversation mid-flight.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { SCRIPTS, type Lang, type Picture, type Segment, type VoiceNote } from "@/lib/script";
import * as player from "@/lib/player";
import { Recorder, sttSupported } from "@/lib/recorder";
import LattuIcon from "./LattuIcon";
import {
  BackIcon,
  BotAvatar,
  CameraIcon,
  ClipIcon,
  EmojiIcon,
  MicIcon,
  MoreIcon,
  PauseIcon,
  PhoneIcon,
  PlayIcon,
  ReplyIcon,
  SendIcon,
  TicksIcon,
  TrashIcon,
  UserAvatar,
  VideoIcon,
} from "./Icons";

type From = "bot" | "user";
type Card = { type: "word" | "letter"; text: string } | { type: "picture"; picture: Picture };
type Option = { label: string; value: string };

type Msg = { id: string; from: From; time: string } & (
  | { kind: "text"; text: string }
  | { kind: "card"; card: Card }
  | { kind: "voice"; seconds: number; lang: string; url?: string; segments?: Segment[]; transcript?: string }
  | { kind: "sticker" }
  | { kind: "buttons"; text: string; options: Option[]; used?: string }
);
type NewMsg = Msg extends infer M ? (M extends Msg ? Omit<M, "id" | "time"> : never) : never;

type Step = "word" | "letter" | "picture" | "firstSound" | null;

const CANCEL = Symbol("cancel");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clock = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

let idSeq = 0;

const WELCOME: NewMsg = {
  from: "bot",
  kind: "buttons",
  text: "Welcome to *Lifteracy*! 👋\nWhich language would you like to try?\n\nआप किस भाषा में आज़माना चाहेंगे?",
  options: [
    { label: "English", value: "lang:en" },
    { label: "हिंदी", value: "lang:hi" },
  ],
};

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [status, setStatus] = useState("online");
  const [awaiting, setAwaiting] = useState(false);
  const [text, setText] = useState("");
  const [recStart, setRecStart] = useState<number | null>(null);
  const [recNow, setRecNow] = useState(0);
  const [menu, setMenu] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const recorder = useRef<Recorder | null>(null);
  const S = useRef({ gen: 0, lang: "en" as Lang, step: null as Step, letter: 0, pictureTries: 0, loops: 0 });

  // ------------------------------------------------------------- helpers --

  const push = useCallback((m: NewMsg): string => {
    const id = `m${++idSeq}`;
    setMsgs((p) => [...p, { ...m, id, time: clock() } as Msg]);
    return id;
  }, []);

  const guard = (g: number) => {
    if (g !== S.current.gen) throw CANCEL;
  };
  const pause = async (ms: number, g: number) => {
    await sleep(ms);
    guard(g);
  };

  const script = () => SCRIPTS[S.current.lang];

  const botText = async (g: number, t: string) => {
    setStatus("typing…");
    await pause(500 + Math.min(1300, t.length * 6), g);
    setStatus("online");
    push({ from: "bot", kind: "text", text: t });
    await pause(400, g);
  };

  const botButtons = async (g: number, t: string, options: Option[]) => {
    setStatus("typing…");
    await pause(700, g);
    setStatus("online");
    push({ from: "bot", kind: "buttons", text: t, options });
  };

  const botCard = async (g: number, card: Card) => {
    await pause(400, g);
    push({ from: "bot", kind: "card", card });
    await pause(700, g);
  };

  const botVoice = async (g: number, note: VoiceNote) => {
    const sc = script();
    setStatus("recording audio…");
    await pause(900, g);
    setStatus("online");
    const seconds = Math.max(1, Math.round(player.estimateSeconds(note.segments)));
    const url = note.rec ? `/audio/voice/${sc.lang}/${note.rec}.mp3` : undefined;
    const id = push({ from: "bot", kind: "voice", seconds, lang: sc.ttsLang, url, segments: note.segments });
    await pause(250, g);
    await player.play({ id, lang: sc.ttsLang, url, segments: note.segments, seconds });
    await pause(300, g);
  };

  const botSticker = async (g: number) => {
    await pause(300, g);
    push({ from: "bot", kind: "sticker" });
    try {
      const clap = new Audio("/audio/clap-short.mp3");
      clap.play().catch(() => {});
    } catch {
      /* ignore */
    }
    await pause(1200, g);
  };

  const listen = (step: Step) => {
    S.current.step = step;
    setAwaiting(true);
  };

  // Run a bot routine; swallow the cancel thrown when the chat restarts.
  const run = async (fn: (g: number) => Promise<void>) => {
    const g = S.current.gen;
    try {
      await fn(g);
    } catch (e) {
      if (e !== CANCEL) throw e;
    }
  };

  // ----------------------------------------------------------- the flow --

  const askWord = async (g: number, again: boolean) => {
    const sc = script();
    await botCard(g, { type: "word", text: sc.word });
    await botVoice(g, again ? sc.voice.readAgain : sc.voice.readWord);
    listen("word");
  };

  const startLesson = async (g: number, lang: Lang) => {
    S.current = { ...S.current, lang, step: null, letter: 0, pictureTries: 0, loops: 0 };
    const sc = SCRIPTS[lang];
    await botText(g, sc.text.intro);
    if (!sttSupported()) await botText(g, sc.text.noStt);
    await pause(2500, g);
    await askWord(g, false);
  };

  const endButtons = (): Option[] => {
    const sc = script();
    return [
      { label: sc.text.tryAgain, value: "again" },
      { label: sc.text.startOver, value: "restart" },
    ];
  };

  // The learner answered the current step: right (ok) or wrong.
  const advance = async (g: number, ok: boolean, wrongIdx?: number) => {
    const sc = script();
    const st = S.current;
    const L = sc.letters[st.letter];
    switch (st.step) {
      case "word":
        if (ok) {
          st.step = null;
          await botSticker(g);
          await botVoice(g, sc.voice.wellDone);
          await botButtons(g, st.loops === 0 ? sc.text.firstTry : sc.text.win, endButtons());
          return;
        }
        st.loops++;
        st.letter = wrongIdx ?? sc.letters.length - 1;
        st.pictureTries = 0;
        await botCard(g, { type: "letter", text: sc.letters[st.letter].char });
        await botVoice(g, sc.voice.whatLetter);
        return listen("letter");

      case "letter":
        if (ok) {
          await botVoice(g, sc.voice.letterRight);
          return askWord(g, true);
        }
        await botCard(g, { type: "picture", picture: L.picture });
        await botVoice(g, sc.voice.whatPicture);
        return listen("picture");

      case "picture":
        if (ok) {
          await botVoice(g, L.pictureRight);
          return listen("firstSound");
        }
        st.pictureTries++;
        if (st.pictureTries < 2) {
          await botVoice(g, L.pictureWrong);
          return listen("picture");
        }
        await botVoice(g, L.pictureWrongMoveOn);
        return listen("firstSound");

      case "firstSound":
        await botVoice(g, ok ? L.firstSoundRight : L.firstSoundWrong);
        return askWord(g, true);
    }
  };

  // Judge what the learner said (or typed) for the current step.
  const answer = (transcripts: string[]) => {
    const sc = script();
    const st = S.current;
    const L = sc.letters[st.letter];
    setAwaiting(false);
    player.stop();
    run(async (g) => {
      if (!transcripts.length) {
        await botButtons(g, sc.text.didntHear, [
          { label: sc.text.btnRight, value: "right" },
          { label: sc.text.btnWrong, value: "wrong" },
        ]);
        return listen(st.step);
      }
      await pause(500, g);
      switch (st.step) {
        case "word": {
          // Use only the best guess here: alternatives would often "hear" the
          // right word even when the learner deliberately misread it.
          const ok = sc.isWord(transcripts[0]);
          return advance(g, ok, ok ? undefined : sc.wrongLetter(transcripts[0]));
        }
        case "letter":
        case "firstSound":
          return advance(g, transcripts.some(L.isLetter));
        case "picture":
          return advance(g, transcripts.some(L.isPicture));
      }
    });
  };

  const restart = useCallback(() => {
    S.current.gen++;
    S.current.step = null;
    player.stop();
    recorder.current?.cancel();
    recorder.current = null;
    setRecStart(null);
    setAwaiting(false);
    setStatus("online");
    setText("");
    setMsgs([]);
    push(WELCOME);
  }, [push]);

  useEffect(() => {
    restart();
    return () => player.stop();
  }, [restart]);

  // ------------------------------------------------------------- inputs --

  const onButton = (msgId: string, opt: Option) => {
    setMsgs((p) => p.map((m) => (m.id === msgId && m.kind === "buttons" ? { ...m, used: opt.value } : m)));
    if (opt.value === "restart") return restart();
    push({ from: "user", kind: "text", text: opt.label });
    if (opt.value.startsWith("lang:")) {
      player.unlockAudio();
      const lang = opt.value.slice(5) as Lang;
      return run((g) => startLesson(g, lang));
    }
    if (opt.value === "again") {
      S.current.loops = 0;
      return run((g) => askWord(g, false));
    }
    if (!S.current.step) return;
    // "I got it right / wrong" fallback when speech wasn't recognised.
    setAwaiting(false);
    player.stop();
    run(async (g) => {
      await pause(400, g);
      await advance(g, opt.value === "right");
    });
  };

  const sendText = () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    push({ from: "user", kind: "text", text: t });
    if (awaiting) answer([t]);
  };

  const startRecording = async () => {
    if (!awaiting || recStart !== null) return;
    player.stop();
    const r = new Recorder();
    recorder.current = r;
    setRecStart(performance.now());
    setRecNow(performance.now());
    await r.start(script().sttLang);
  };

  const sendRecording = async () => {
    const r = recorder.current;
    if (!r) return;
    recorder.current = null;
    setRecStart(null);
    const rec = await r.stop();
    push({
      from: "user",
      kind: "voice",
      seconds: rec.seconds,
      lang: script().sttLang,
      url: rec.audioUrl,
      transcript: rec.transcripts[0] ?? "",
    });
    answer(rec.transcripts);
  };

  const cancelRecording = () => {
    recorder.current?.cancel();
    recorder.current = null;
    setRecStart(null);
  };

  useEffect(() => {
    if (recStart === null) return;
    const t = window.setInterval(() => setRecNow(performance.now()), 250);
    return () => window.clearInterval(t);
  }, [recStart]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  // -------------------------------------------------------------- render --

  const recording = recStart !== null;
  const lang = S.current.lang;

  return (
    <div className="wa">
      <header className="waHeader">
        <button className="iconBtn" aria-label="Restart demo" onClick={restart}>
          <BackIcon />
        </button>
        <BotAvatar size={38} />
        <div className="waTitle">
          <div className="waName">Lifteracy</div>
          <div className="waStatus">{status}</div>
        </div>
        <span className="iconBtn dim" aria-hidden="true">
          <VideoIcon />
        </span>
        <span className="iconBtn dim" aria-hidden="true">
          <PhoneIcon />
        </span>
        <button className="iconBtn" aria-label="Menu" onClick={() => setMenu((m) => !m)}>
          <MoreIcon />
        </button>
        {menu && (
          <div className="waMenu" onClick={() => setMenu(false)}>
            <button onClick={restart}>Restart demo</button>
          </div>
        )}
      </header>

      <div className="waBody" ref={scroller} onClick={() => setMenu(false)}>
        <div className="chip">Today</div>
        <div className="chip notice">
          🔒 A demo of the Lifteracy WhatsApp chatbot. It runs in your browser and saves nothing.
        </div>
        {msgs.map((m, i) => (
          <Message key={m.id} m={m} tail={i === 0 || msgs[i - 1].from !== m.from} onButton={onButton} />
        ))}
      </div>

      <footer className="waFooter">
        {recording ? (
          <div className="pill recPill">
            <button className="iconBtn trash" aria-label="Cancel recording" onClick={cancelRecording}>
              <TrashIcon />
            </button>
            <span className="recDot" />
            <span className="recTime">{mmss((recNow - (recStart ?? recNow)) / 1000)}</span>
            <span className="recHint">{lang === "hi" ? "बोलिए…" : "Speak now…"}</span>
          </div>
        ) : (
          <div className="pill">
            <span className="pillIcon" aria-hidden="true">
              <EmojiIcon />
            </span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder={SCRIPTS[lang].text.typeHint}
              aria-label="Type a message"
            />
            <span className="pillIcon" aria-hidden="true">
              <ClipIcon />
            </span>
            {!text && (
              <span className="pillIcon" aria-hidden="true">
                <CameraIcon />
              </span>
            )}
          </div>
        )}
        {recording ? (
          <button className="fab" aria-label="Send voice message" onClick={sendRecording}>
            <SendIcon />
          </button>
        ) : text ? (
          <button className="fab" aria-label="Send" onClick={sendText}>
            <SendIcon />
          </button>
        ) : (
          <button
            className={`fab ${awaiting ? "fabReady" : "fabIdle"}`}
            aria-label="Record voice message"
            onClick={startRecording}
          >
            <MicIcon />
          </button>
        )}
      </footer>
    </div>
  );
}

// ----------------------------------------------------------------- bubbles --

// WhatsApp-style *bold*.
function Rich({ text }: { text: string }) {
  const parts = text.split(/\*([^*\n]+)\*/g);
  return <>{parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p))}</>;
}

function Meta({ m }: { m: Msg }) {
  return (
    <span className="meta">
      {m.time}
      {m.from === "user" && <TicksIcon className="ticks" />}
    </span>
  );
}

function Message({ m, tail, onButton }: { m: Msg; tail: boolean; onButton: (id: string, o: Option) => void }) {
  const side = m.from === "bot" ? "in" : "out";
  const cls = `bubble ${side}${tail ? " tail" : ""}`;

  if (m.kind === "sticker")
    return (
      <div className={`row ${side}`}>
        <div className="sticker" role="img" aria-label="Thumbs up sticker">
          <span>👍</span>
        </div>
      </div>
    );

  if (m.kind === "text")
    return (
      <div className={`row ${side}`}>
        <div className={cls}>
          <span className="text">
            <Rich text={m.text} />
          </span>
          <Meta m={m} />
        </div>
      </div>
    );

  if (m.kind === "card")
    return (
      <div className={`row ${side}`}>
        <div className={`${cls} media`}>
          <div className={`card card-${m.card.type}`}>
            {m.card.type === "picture" ? (
              "emoji" in m.card.picture ? (
                <span className="cardEmoji">{m.card.picture.emoji}</span>
              ) : (
                <LattuIcon size={150} />
              )
            ) : (
              <span className="cardText">{m.card.text}</span>
            )}
          </div>
          <Meta m={m} />
        </div>
      </div>
    );

  if (m.kind === "buttons")
    return (
      <div className={`row ${side}`}>
        <div className="buttonsMsg">
          <div className={cls}>
            <span className="text">
              <Rich text={m.text} />
            </span>
            <Meta m={m} />
          </div>
          {m.options.map((o) => (
            <button
              key={o.value}
              className={`replyBtn${m.used === o.value ? " chosen" : ""}`}
              disabled={!!m.used}
              onClick={() => onButton(m.id, o)}
            >
              <ReplyIcon /> {o.label}
            </button>
          ))}
        </div>
      </div>
    );

  return <VoiceBubble m={m} cls={cls} side={side} />;
}

function VoiceBubble({ m, cls, side }: { m: Extract<Msg, { kind: "voice" }>; cls: string; side: string }) {
  const [ps, setPs] = useState<player.PlayState>({ id: null, progress: 0 });
  useEffect(() => player.subscribe(setPs), []);
  const playing = ps.id === m.id;
  const progress = playing ? ps.progress : 0;
  const canPlay = !!(m.url || m.segments);
  const bars = waveform(m.id);

  const toggle = () => {
    if (playing) return player.stop();
    if (canPlay) player.play({ id: m.id, lang: m.lang, url: m.url, segments: m.segments, seconds: m.seconds });
  };

  return (
    <div className={`row ${side}`}>
      <div className={`${cls} voice`}>
        <div className="voiceRow">
          <button className="playBtn" onClick={toggle} disabled={!canPlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <PauseIcon /> : canPlay ? <PlayIcon /> : <MicIcon size={22} />}
          </button>
          <div className="wave">
            {bars.map((h, i) => (
              <span key={i} className={i / bars.length < progress ? "on" : ""} style={{ height: `${h}%` }} />
            ))}
            <span className="knob" style={{ left: `${progress * 100}%` }} />
          </div>
          <div className="voiceAvatar">
            {m.from === "bot" ? <BotAvatar size={44} /> : <UserAvatar size={44} />}
            <span className={`micBadge ${player.wasPlayed(m.id) || m.from === "user" ? "heard" : ""}`}>
              <MicIcon size={13} />
            </span>
          </div>
        </div>
        <div className="voiceFoot">
          <span>{mmss(playing ? progress * m.seconds : m.seconds)}</span>
          <Meta m={m} />
        </div>
        {m.from === "user" && (
          <div className="transcript">{m.transcript ? `“${m.transcript}”` : "(no speech recognised)"}</div>
        )}
      </div>
    </div>
  );
}

// Stable pseudo-random bar heights per message.
function waveform(id: string): number[] {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < 32; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const env = Math.sin((i / 31) * Math.PI) * 0.6 + 0.4;
    out.push(Math.round(18 + ((h >>> 16) % 82) * env));
  }
  return out;
}
