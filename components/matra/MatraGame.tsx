"use client";

// ---------------------------------------------------------------------------
// MATRA MAKER (मात्रा जोड़ो) — build a syllable by adding the right vowel sign.
// ---------------------------------------------------------------------------
// A consonant sits in the middle (क). The goal syllable is shown and spoken
// ("की"). Along the bottom are matra signs (◌ा ◌ि ◌ी ◌ु …). The child DRAGS the
// matra that makes the goal sound up onto the consonant: it snaps on, the whole
// syllable appears in its proper form (की) and is spoken. The matras attach in
// their real positions (right / left / above / below), so children see where
// each one goes. Six rounds, then applause.
//
// Syllables are spoken with the phone's Hindi text-to-speech (see lib/tts) —
// no recordings needed. Correct/wrong/win cues reuse the app's sound effects.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LETTERS, getLetter, Letter } from "@/lib/letters";
import { MATRAS, Matra, matraChip, syllable } from "@/lib/matras";
import { primeTts, speakSyllable, stopTts } from "@/lib/tts";
import { playBingSound, playWrongSound, playWinSound, stopWinLoseSounds, unlockAudio } from "@/lib/audio";

const TOTAL_ROUNDS = 6;
const OPTIONS = 4; // matra choices per round

type Phase = "start" | "playing" | "won";

interface Round {
  consonant: Letter;
  matra: Matra;
  options: Matra[];
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function makeRound(): Round {
  const consonant = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const matra = MATRAS[Math.floor(Math.random() * MATRAS.length)];
  const distractors = shuffle(MATRAS.filter((m) => m.id !== matra.id)).slice(0, OPTIONS - 1);
  return { consonant, matra, options: shuffle([matra, ...distractors]) };
}

export default function MatraGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [round, setRound] = useState(0);
  const [data, setData] = useState<Round | null>(null);
  const [placed, setPlaced] = useState(false); // correct matra locked on
  const [shake, setShake] = useState(false);
  const [offset, setOffset] = useState<Record<string, { x: number; y: number }>>({});

  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; sx: number; sy: number; pid: number } | null>(null);
  const busyRef = useRef(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => {
    clearTimers();
    stopTts();
  }, []);

  const speakGoal = useCallback((r: Round) => {
    speakSyllable(syllable(r.consonant.char, r.matra));
  }, []);

  const newRound = useCallback(
    (n: number) => {
      const r = makeRound();
      setData(r);
      setRound(n);
      setPlaced(false);
      setShake(false);
      setOffset({});
      busyRef.current = false;
      later(() => speakGoal(r), 500);
    },
    [speakGoal]
  );

  const startGame = useCallback(() => {
    unlockAudio();
    primeTts();
    stopWinLoseSounds();
    newRound(0);
    setPhase("playing");
  }, [newRound]);

  const onDown = (e: React.PointerEvent, id: string) => {
    if (busyRef.current || placed) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id, sx: e.clientX, sy: e.clientY, pid: e.pointerId };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pid) return;
    setOffset((o) => ({ ...o, [d.id]: { x: e.clientX - d.sx, y: e.clientY - d.sy } }));
  };
  const onUp = (e: React.PointerEvent, m: Matra) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pid || !data) return;
    drag.current = null;
    const chipEl = e.currentTarget as HTMLElement;
    const cr = cardRef.current?.getBoundingClientRect();
    const br = chipEl.getBoundingClientRect();
    const cx = br.left + br.width / 2;
    const cy = br.top + br.height / 2;
    const onCard =
      !!cr && cx > cr.left - 30 && cx < cr.right + 30 && cy > cr.top - 30 && cy < cr.bottom + 40;

    if (onCard && m.id === data.matra.id) {
      // Correct — lock it on, show + speak the whole syllable, advance.
      busyRef.current = true;
      setPlaced(true);
      setOffset((o) => ({ ...o, [m.id]: { x: 0, y: 0 } }));
      playBingSound();
      later(() => speakGoal(data), 250);
      later(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          playWinSound();
          setPhase("won");
        } else {
          newRound(round + 1);
        }
      }, 1500);
    } else {
      // Wrong (or dropped away) — snap back, a soft buzz + a shake if on the card.
      setOffset((o) => ({ ...o, [m.id]: { x: 0, y: 0 } }));
      if (onCard) {
        playWrongSound();
        setShake(true);
        later(() => setShake(false), 450);
      }
    }
  };

  return (
    <div className="matraApp">
      <Link href="/" className="cornerLink" aria-label="games home" onClick={() => stopTts()}>
        🏠
      </Link>
      {phase !== "start" && <div className="blocksLevelPill">✨ {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>}

      {phase === "playing" && data && (
        <div className="matraPlay" onPointerMove={onMove}>
          {/* Goal */}
          <div className="matraGoal">
            <span className="matraGoalLabel">यह बनाओ</span>
            <span className="matraGoalSyl">{syllable(data.consonant.char, data.matra)}</span>
            <button
              type="button"
              className="soundBtn soundBtn--compact"
              onClick={() => {
                unlockAudio();
                primeTts();
                speakGoal(data);
              }}
              aria-label="सुनो"
            >
              🔊 सुनो
            </button>
          </div>

          {/* Consonant card (drop target) */}
          <div className="matraCardWrap">
            <div ref={cardRef} className={`matraCard${placed ? " done" : ""}${shake ? " shake" : ""}`}>
              {placed ? syllable(data.consonant.char, data.matra) : data.consonant.char}
            </div>
          </div>

          {/* Matra chips to drag */}
          <div className="matraTray">
            {data.options.map((m) => {
              const off = offset[m.id] ?? { x: 0, y: 0 };
              const hidden = placed && m.id === data.matra.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className="matraChip"
                  onPointerDown={(e) => onDown(e, m.id)}
                  onPointerUp={(e) => onUp(e, m)}
                  onPointerCancel={(e) => onUp(e, m)}
                  style={{
                    transform: `translate3d(${off.x}px, ${off.y}px, 0)`,
                    opacity: hidden ? 0 : 1,
                    touchAction: "none",
                    zIndex: off.x || off.y ? 20 : 1,
                  }}
                  aria-label={m.roman}
                >
                  {matraChip(m)}
                </button>
              );
            })}
          </div>
          <p className="matraHint">सही मात्रा को “{data.consonant.char}” पर खींचो</p>
        </div>
      )}

      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">✨</div>
            <div className="overlayTitle">मात्रा जोड़ो</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              अक्षर पर सही मात्रा लगाकर शब्द बनाओ (जैसे क + ी = की)
            </p>
            <button type="button" className="bigButton" onClick={startGame}>
              ▶ खेलो
            </button>
            <Link href="/" className="overlayLink">
              🏠 घर
            </Link>
          </div>
        </div>
      )}

      {phase === "won" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🏆</div>
            <div className="overlayTitle">शाबाश!</div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                stopWinLoseSounds();
                startGame();
              }}
            >
              ▶ फिर से
            </button>
            <Link href="/" className="overlayLink" onClick={() => stopTts()}>
              🏠 घर
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
