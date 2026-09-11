"use client";

// ---------------------------------------------------------------------------
// टीबी का सफ़र — THE TB JOURNEY
// ---------------------------------------------------------------------------
// A decision game about getting through TB treatment alive, cured, and without
// giving TB to anybody at home. Built for tb.care.
//
// How a turn works:
//   1. A scene opens. Its line, and then every choice, is read out loud, so the
//      game can be played by somebody who cannot read Hindi.
//   2. The player taps a choice.
//   3. The result screen shows what happened AND the true TB fact behind it —
//      this is where the learning happens, whether the choice was good or bad.
//   4. The meters move, and the next scene opens.
//
// Losing is never the end: the player can try the same life again, so they can
// keep playing until they win.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Meters, { Bar, MemberDot, MonthTrack } from "./Meters";
import { TbArt, TbIcon } from "./Figures";
import {
  ENDINGS,
  advance,
  healthColor,
  finalEnding,
  infectedCount,
  newGame,
  resolveInfections,
} from "@/lib/tb/engine";
import { FIRST_SCENE, getScene, isEnding, nextSceneId } from "@/lib/tb/story";
import { HOME_HI, WORK_HI, riskInfo } from "@/lib/tb/profile";
import {
  primeVoice,
  speak,
  speakSequence,
  stopSpeaking,
  subscribeSpeaking,
} from "@/lib/tb/speech";
import { INTRO_LINE, LIFE_INTRO, LIFE_START, RULES_LINES } from "@/lib/tb/uiLines";
import { playSound, unlockAudio } from "@/lib/audio";
import type { EndingId, GameState, Option, Result } from "@/lib/tb/types";

const PADHAIPAL_URL = "https://wa.me/918528097842";

// A small deterministic shuffle. The choices must be in a different order every
// game — otherwise a player learns "the right answer is the first one" instead
// of learning about TB — but the order must NOT change while they are looking
// at it, or they will tap something they did not mean to. Seeding it from the
// scene id and one per-game number gives both.
function seededOrder<T>(items: T[], seed: number): T[] {
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Follows the voice, so the line being read can be highlighted. */
function useSpeaking(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => subscribeSpeaking(setId), []);
  return id;
}

/** Class name for a line that is being read aloud right now. */
function reading(speakingId: string | null, id: string): string {
  return speakingId === id ? " tbReading" : "";
}

type Phase = "intro" | "life" | "rules" | "scene" | "result" | "ending";

interface Pending {
  result: Result;
  nextId: string;
  audioId: string;
}

export default function TbGame() {
  const [state, setState] = useState<GameState>(() => newGame());
  const [phase, setPhase] = useState<Phase>("intro");
  const [pending, setPending] = useState<Pending | null>(null);
  const [endingId, setEndingId] = useState<EndingId>("curedClean");
  /** Changes each new game, so the choices come up in a fresh order. */
  const [shuffleSeed, setShuffleSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const speakingId = useSpeaking();
  // Facts the player has already met, newest last — shown in the recap.
  const factsRef = useRef<string[]>([]);

  const scene = getScene(state.sceneId);

  // The choices as the player sees them: same choices, order reshuffled per
  // scene and per game.
  const options = useMemo(() => {
    if (!scene) return [];
    const usable = scene.options.filter((o) => !o.show || o.show(state));
    return seededOrder(usable, hash(scene.id) ^ shuffleSeed);
    // `state` is only read to test which options apply, which cannot change
    // within a scene, so the order is stable while the scene is on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, shuffleSeed]);

  // The household cards dealt to this player, with a fixed audio id each.
  const lifeRows = useMemo(() => {
    const p = state.profile;
    return [
      { id: `life_home_${p.home}`, hi: HOME_HI[p.home], icon: "window" as const },
      { id: `life_work_${p.work}`, hi: WORK_HI[p.work], icon: "work" as const },
      ...p.risks.map((r) => ({
        id: `life_risk_${r}`,
        hi: riskInfo(r).hi,
        icon:
          r === "sharab"
            ? ("sharab" as const)
            : r === "bidi"
            ? ("bidi" as const)
            : r === "kamzori"
            ? ("food" as const)
            : ("doctor" as const),
      })),
    ];
  }, [state.profile]);

  // ---- voice -------------------------------------------------------------
  const say = useCallback((id: string, text: string) => {
    speak(id, text);
  }, []);

  // Read the whole scene out: the situation first, then each choice in turn.
  useEffect(() => {
    if (phase !== "scene" || !scene) return;
    const lines = [
      { id: scene.id, text: scene.hi + (scene.subHi ? " " + scene.subHi : "") },
      ...options.map((o) => ({ id: `${scene.id}_${o.id}`, text: o.hi })),
    ];
    speakSequence(lines);
    return () => stopSpeaking();
  }, [phase, scene, options]);

  useEffect(() => {
    if (phase !== "result" || !pending) return;
    // A short chime first — a player who cannot read knows at once whether the
    // choice was a good one — then the words. A "mixed" result gets no chime:
    // it was neither right nor wrong, and the spoken line explains why.
    const tone = pending.result.tone;
    if (tone !== "mixed") {
      playSound(
        tone === "good" ? "/audio/tb/sfx-correct.wav" : "/audio/tb/sfx-wrong.wav",
        tone === "good" ? "correct" : "wrong"
      );
    }
    const t = window.setTimeout(() => {
      speakSequence([
        { id: pending.audioId, text: pending.result.hi },
        { id: `${pending.audioId}_fact`, text: pending.result.factHi },
      ]);
    }, 700);
    return () => {
      window.clearTimeout(t);
      stopSpeaking();
    };
  }, [phase, pending]);

  useEffect(() => {
    if (phase !== "ending") return;
    const e = ENDINGS[endingId];
    playSound(e.win ? "/audio/clap.mp3" : "/audio/wa-wa-wa.mp3", e.win ? "win" : "lose");
    const t = window.setTimeout(() => {
      speakSequence([
        { id: `end_${endingId}`, text: e.hi },
        { id: `end_${endingId}_fact`, text: e.factHi },
      ]);
    }, 900);
    return () => {
      window.clearTimeout(t);
      stopSpeaking();
    };
  }, [phase, endingId]);

  useEffect(() => {
    if (phase !== "life") return;
    speakSequence([
      { id: "life_intro", text: LIFE_INTRO },
      ...lifeRows.map((r) => ({ id: r.id, text: r.hi })),
      { id: "life_start", text: LIFE_START },
    ]);
    return () => stopSpeaking();
  }, [phase, lifeRows]);

  useEffect(() => {
    if (phase !== "rules") return;
    speakSequence(
      Object.values(RULES_LINES).map((l) => ({ id: l.id, text: l.hi }))
    );
    return () => stopSpeaking();
  }, [phase]);

  // The very first tap of the game is what lets a browser make any sound at
  // all, so use it: unlock audio and read the opening line out. Without this
  // the first screen is silent and the game only finds its voice on screen two.
  useEffect(() => {
    if (phase !== "intro") return;
    const wake = () => {
      primeVoice();
      unlockAudio();
      speak("intro", INTRO_LINE);
    };
    window.addEventListener("pointerdown", wake, { once: true });
    return () => window.removeEventListener("pointerdown", wake);
  }, [phase]);

  // ---- starting and restarting -------------------------------------------
  const dealNewLife = useCallback(() => {
    stopSpeaking();
    factsRef.current = [];
    setShuffleSeed(Math.floor(Math.random() * 1e9));
    setState(newGame());
    setPending(null);
    setPhase("life");
  }, []);

  const retrySameLife = useCallback(() => {
    stopSpeaking();
    factsRef.current = [];
    setShuffleSeed(Math.floor(Math.random() * 1e9));
    // Same household, same risks — a fresh run at the same hard road.
    setState(newGame({ ...state.profile, members: state.profile.members.map((m) => ({ ...m, exposure: 0, infected: false, protectedByTpt: false })) }));
    setPending(null);
    setPhase("life");
  }, [state.profile]);

  const showRules = useCallback(() => {
    stopSpeaking();
    setPhase("rules");
  }, []);

  const beginStory = useCallback(() => {
    stopSpeaking();
    setState((s) => ({ ...s, sceneId: FIRST_SCENE }));
    setPhase("scene");
  }, []);

  // ---- one turn ----------------------------------------------------------
  const choose = useCallback(
    (opt: Option) => {
      if (!scene) return;
      stopSpeaking();
      const after = advance(state, opt.effect);
      const nextId = nextSceneId(opt.next, after);
      factsRef.current = [...factsRef.current, opt.result.factHi];
      setState({ ...after, learned: factsRef.current });
      setPending({
        result: opt.result,
        nextId,
        audioId: `${scene.id}_${opt.id}_result`,
      });
      setPhase("result");
    },
    [scene, state]
  );

  const goOn = useCallback(() => {
    if (!pending) return;
    stopSpeaking();
    const { nextId } = pending;
    setPending(null);

    if (isEnding(nextId)) {
      // Any germs still in the air get their last chance now.
      const settled = state.infectious ? resolveInfections(state) : state;
      let id: EndingId;
      if (nextId === "e_died") id = "died";
      else if (nextId === "e_spreading") id = "spreading";
      else id = finalEnding(settled);
      setState(settled);
      setEndingId(id);
      setPhase("ending");
      return;
    }

    const next = getScene(nextId);
    if (!next) return;
    const entered = next.onEnter ? advance(state, next.onEnter) : state;
    setState({ ...entered, sceneId: nextId });
    setPhase("scene");
  }, [pending, state]);

  // ---- screens -----------------------------------------------------------
  if (phase === "intro") {
    return (
      <main className="tbApp tbApp--card tbApp--start">
        <div className="tbStartCard">
          <h1 className="tbTitle">टीबी का सफ़र</h1>
          <TbArt name="family" />
          <button
            className={`tbSay tbSay--block tbStartLine${reading(speakingId, "intro")}`}
            onClick={() => say("intro", INTRO_LINE)}
          >
            <span>{INTRO_LINE}</span>
          </button>
          <button className="tbListen" onClick={() => say("intro", INTRO_LINE)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9 L4 15 L8 15 L13 19 L13 5 L8 9 Z" />
              <path d="M16 9 q3 3 0 6" />
              <path d="M19 6 q5 6 0 12" />
            </svg>
            सुनिए
          </button>
          <button
            className="tbBigButton"
            onClick={() => {
              primeVoice();
              unlockAudio();
              dealNewLife();
            }}
          >
            खेल शुरू करें
          </button>
          <Link href="/" className="tbBackLink">
            ← और खेल
          </Link>
        </div>
      </main>
    );
  }

  if (phase === "life") {
    return (
      <main className="tbApp tbApp--card">
        <div className="tbLife">
          <h2 className="tbLifeTitle">आपका घर</h2>
          <TbArt name={state.profile.home === "ekKamra" ? "smallHome" : "family"} />
          <ul className="tbLifeList">
            {lifeRows.map((row) => (
              <li key={row.id}>
                <button
                  className={`tbLifeRow${reading(speakingId, row.id)}`}
                  onClick={() => say(row.id, row.hi)}
                >
                  <TbIcon name={row.icon} />
                  <span>{row.hi}</span>
                </button>
              </li>
            ))}
          </ul>
          <button className="tbBigButton" onClick={showRules}>
            आगे
          </button>
        </div>
      </main>
    );
  }

  // ---- how to play: the meters explained, with this player's real numbers --
  if (phase === "rules") {
    const rules = [
      {
        ...RULES_LINES.health,
        art: (
          <span className="tbRuleMeter">
            <Bar value={state.health} color={healthColor(state.health)} />
            <b style={{ color: healthColor(state.health) }}>{state.health}/10</b>
          </span>
        ),
      },
      {
        ...RULES_LINES.money,
        art: (
          <span className="tbRuleMeter">
            <Bar value={state.money} color="#e8a33d" />
            <b>{state.money}/10</b>
          </span>
        ),
      },
      {
        ...RULES_LINES.family,
        art: (
          <span className="tbRuleMeter">
            {state.members.map((m) => (
              <MemberDot key={m.id} m={m} />
            ))}
          </span>
        ),
      },
      {
        ...RULES_LINES.months,
        art: (
          <span className="tbRuleMeter">
            <MonthTrack month={0} />
          </span>
        ),
      },
    ];
    return (
      <main className="tbApp tbApp--card">
        <div className="tbLife tbRules">
          <h2 className="tbLifeTitle">कैसे खेलें</h2>
          <ul className="tbLifeList">
            {rules.map((r) => (
              <li key={r.id}>
                <button
                  className={`tbLifeRow tbRuleRow${reading(speakingId, r.id)}`}
                  onClick={() => say(r.id, r.hi)}
                >
                  {r.art}
                  <span>{r.hi}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className={`tbRuleWin${reading(speakingId, RULES_LINES.win.id)}`}>
            <TbIcon name="yes" />
            <span>{RULES_LINES.win.hi}</span>
          </p>
          <p className={`tbRuleLose${reading(speakingId, RULES_LINES.lose.id)}`}>
            <TbIcon name="no" />
            <span>{RULES_LINES.lose.hi}</span>
          </p>
          <button className="tbBigButton" onClick={beginStory}>
            शुरू करें
          </button>
        </div>
      </main>
    );
  }

  if (phase === "ending") {
    const e = ENDINGS[endingId];
    const ill = infectedCount(state);
    return (
      <main className={`tbApp tbApp--card tbApp--end tbEnd--${e.win ? "win" : "lose"}`}>
        <div className="tbEndCard">
          <h2 className="tbEndTitle">{e.win ? "आप जीत गए!" : "इस बार नहीं"}</h2>
          <TbArt name={e.art} />
          <button
            className={`tbSay tbSay--block${reading(speakingId, `end_${endingId}`)}`}
            onClick={() => say(`end_${endingId}`, e.hi)}
          >
            <span>{e.hi}</span>
          </button>
          <p className={`tbFact${reading(speakingId, `end_${endingId}_fact`)}`}>{e.factHi}</p>

          <div className="tbScoreRow">
            <span className="tbScoreItem">
              सेहत {state.health}/10
            </span>
            <span className="tbScoreItem">
              महीने {Math.min(state.month, 6)}/6
            </span>
            <span className="tbScoreItem">
              {ill === 0 ? "घर में कोई बीमार नहीं" : `घर में ${ill} बीमार`}
            </span>
          </div>

          {/* After a loss the player is offered the SAME life again, so they can
              try the road they just learned about and finally win it. After a
              win, a new household is the interesting next game. */}
          <div className="tbEndButtons">
            {e.win ? (
              <>
                <button className="tbBigButton" onClick={dealNewLife}>
                  नया घर, नया सफ़र
                </button>
                <button className="tbBigButton tbBigButton--ghost" onClick={retrySameLife}>
                  यही सफ़र फिर से
                </button>
              </>
            ) : (
              <>
                <button className="tbBigButton" onClick={retrySameLife}>
                  फिर से कोशिश करें
                </button>
                <button className="tbBigButton tbBigButton--ghost" onClick={dealNewLife}>
                  नया घर, नया सफ़र
                </button>
              </>
            )}
          </div>
          <a className="tbBackLink" href={PADHAIPAL_URL}>
            पाठ पर जाएं
          </a>
        </div>
      </main>
    );
  }

  if (!scene) return null;

  // ---- the playing screen -------------------------------------------------
  return (
    <main className="tbApp">
      <header className="tbTop">
        <Meters state={state} onSay={say} speakingId={speakingId} />
        <MonthTrack month={Math.min(state.month, 6)} />
      </header>

      <section className="tbStage">
        <TbArt name={scene.art} />
        <button
          className={`tbSay tbSay--block${reading(speakingId, scene.id)}`}
          onClick={() =>
            say(scene.id, scene.hi + (scene.subHi ? " " + scene.subHi : ""))
          }
        >
          <span>
            {scene.hi}
            {scene.subHi ? <em className="tbSub">{scene.subHi}</em> : null}
          </span>
        </button>
      </section>

      <nav className="tbOptions">
        {options.map((o) => (
            <div className="tbOptionRow" key={o.id}>
              <button
                className={`tbOption${reading(speakingId, `${scene.id}_${o.id}`)}`}
                // names the choice for tests, which cannot rely on position
                // now that the order is shuffled
                data-option={o.id}
                onClick={() => choose(o)}
              >
                <TbIcon name={o.icon} />
                <span>{o.hi}</span>
              </button>
              <button
                className="tbSpeak"
                aria-label="सुनें"
                onClick={() => say(`${scene.id}_${o.id}`, o.hi)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 9 L4 15 L8 15 L13 19 L13 5 L8 9 Z" />
                  <path d="M16 9 q3 3 0 6" />
                  <path d="M19 6 q5 6 0 12" />
                </svg>
              </button>
            </div>
          ))}
      </nav>

      {phase === "result" && pending && (
        <div className="tbResultScrim">
          <div className={`tbResult tbResult--${pending.result.tone}`}>
            <TbIcon name={pending.result.icon} />
            <p className={`tbResultText${reading(speakingId, pending.audioId)}`}>
              {pending.result.hi}
            </p>
            <p className={`tbFact${reading(speakingId, `${pending.audioId}_fact`)}`}>
              {pending.result.factHi}
            </p>
            <button className="tbBigButton" onClick={goOn}>
              आगे
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
