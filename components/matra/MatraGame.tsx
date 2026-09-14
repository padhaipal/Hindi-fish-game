"use client";

// ---------------------------------------------------------------------------
// MATRA MAKER (मात्रा जोड़ो) — build a syllable by adding the right vowel sign.
// ---------------------------------------------------------------------------
// A consonant sits in the middle (क). The goal syllable is shown and spoken
// ("की"). A 3×2 grid of matra tiles (◌ा ◌ि ◌ी ◌ु …) sits below. The child DRAGS
// the matra that makes the goal sound up onto the consonant: it snaps on, the
// whole syllable appears in its proper form (की) and is spoken. Six rounds,
// then applause.
//
// Runs standalone (its own start/win screens) OR, when `lockedMatra` is given,
// as one stop in a matra adventure: the matra is fixed and the CONSONANT varies
// so the child learns that (say) ा makes का, पा, ता … On the last round it hands
// back with onFinish() and shows no overlays of its own.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LETTERS, Letter } from "@/lib/letters";
import { MATRAS, Matra, getMatra, matraChip, syllable } from "@/lib/matras";
import { primeTts, speakSyllable, stopTts } from "@/lib/tts";
import { playBingSound, playWrongSound, playWinSound, stopWinLoseSounds, unlockAudio } from "@/lib/audio";

const OPTIONS = 6; // matra choices per round (a 3×2 grid)

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

function makeRound(lockedMatra?: string): Round {
  const consonant = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const matra = lockedMatra ? getMatra(lockedMatra) : MATRAS[Math.floor(Math.random() * MATRAS.length)];
  const distractors = shuffle(MATRAS.filter((m) => m.id !== matra.id)).slice(0, OPTIONS - 1);
  return { consonant, matra, options: shuffle([matra, ...distractors]) };
}

export default function MatraGame({
  lockedMatra,
  rounds = 6,
  onFinish,
}: {
  lockedMatra?: string; // adventure mode: fix this matra, vary the consonant
  rounds?: number;
  onFinish?: () => void;
} = {}) {
  const embedded = !!lockedMatra;
  const totalRounds = embedded ? rounds : 6;

  const [phase, setPhase] = useState<Phase>("start");
  const [round, setRound] = useState(0);
  const [data, setData] = useState<Round | null>(null);
  const [placed, setPlaced] = useState(false);
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
  useEffect(
    () => () => {
      clearTimers();
      stopTts();
    },
    []
  );

  const speakGoal = useCallback((r: Round) => {
    speakSyllable(syllable(r.consonant.char, r.matra));
  }, []);

  const newRound = useCallback(
    (n: number) => {
      const r = makeRound(lockedMatra);
      setData(r);
      setRound(n);
      setPlaced(false);
      setShake(false);
      setOffset({});
      busyRef.current = false;
      later(() => speakGoal(r), 500);
    },
    [speakGoal, lockedMatra]
  );

  const startGame = useCallback(() => {
    unlockAudio();
    primeTts();
    stopWinLoseSounds();
    newRound(0);
    setPhase("playing");
  }, [newRound]);

  // Auto-start when embedded in an adventure.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!embedded || startedRef.current) return;
    startedRef.current = true;
    newRound(0);
    setPhase("playing");
  }, [embedded, newRound]);

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
    const onCard = !!cr && cx > cr.left - 30 && cx < cr.right + 30 && cy > cr.top - 30 && cy < cr.bottom + 40;

    if (onCard && m.id === data.matra.id) {
      busyRef.current = true;
      setPlaced(true);
      setOffset((o) => ({ ...o, [m.id]: { x: 0, y: 0 } }));
      playBingSound();
      later(() => speakGoal(data), 250);
      later(() => {
        if (round + 1 >= totalRounds) {
          if (embedded) onFinish?.();
          else {
            playWinSound();
            setPhase("won");
          }
        } else {
          newRound(round + 1);
        }
      }, 1500);
    } else {
      setOffset((o) => ({ ...o, [m.id]: { x: 0, y: 0 } }));
      if (onCard) {
        playWrongSound();
        setShake(true);
        later(() => setShake(false), 450);
      }
    }
  };

  return (
    <div className={`matraApp${embedded ? " matraApp--adv" : ""}`}>
      {!embedded && (
        <Link href="/" className="cornerLink" aria-label="games home" onClick={() => stopTts()}>
          🏠
        </Link>
      )}
      {!embedded && phase !== "start" && (
        <div className="blocksLevelPill">
          ✨ {Math.min(round + 1, totalRounds)}/{totalRounds}
        </div>
      )}

      {phase === "playing" && data && (
        <div className="matraPlay" onPointerMove={onMove}>
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

          <div className="matraCardWrap">
            <div ref={cardRef} className={`matraCard${placed ? " done" : ""}${shake ? " shake" : ""}`}>
              {placed ? syllable(data.consonant.char, data.matra) : data.consonant.char}
            </div>
          </div>

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

      {!embedded && phase === "start" && (
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

      {!embedded && phase === "won" && (
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
