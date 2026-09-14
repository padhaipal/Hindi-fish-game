"use client";

// ---------------------------------------------------------------------------
// LETTER ADVENTURE — a guided journey through one letter.
// ---------------------------------------------------------------------------
// For a single letter, the child travels through five mini-games in order:
//   🐸 Frog hop → 🐠 Fish → 🎈 Balloon pop → 🧩 Build the letter → ✍️ Trace it
// A slim progress bar floats across the top the whole time (home + the letter +
// five stops). Each game hands back with onDone/onFinish; we show a quick
// "शाबाश!" flash and flow straight into the next stop. Finishing the last stop
// celebrates and offers the next letter.
//
// The games run in a locked single-letter, forgiving "adventure" mode (see the
// lockedLetter/onFinish props on PondGame + PondHopGame); the other steps are
// purpose-built for one letter.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PondHopGame from "@/components/pondhop/PondHopGame";
import PondGame from "@/components/fish/PondGame";
import BalloonPop from "@/components/balloon/BalloonPop";
import BuildLetter from "@/components/build/BuildLetter";
import TraceStep from "@/components/adventure/TraceStep";
import FreeWriteStep from "@/components/adventure/FreeWriteStep";
import { getLetter, LETTERS } from "@/lib/letters";
import { playWinSound, stopWinLoseSounds, unlockAudio } from "@/lib/audio";

type StepDef = { key: string; icon: string; render: (letterId: string, done: () => void) => React.ReactNode };

// Recognise the letter first (moving games), then form it (build, then write).
const STEPS: StepDef[] = [
  { key: "pond", icon: "🐸", render: (id, done) => <PondHopGame lockedLetter={id} lockedLevel={4} rounds={1} onFinish={done} /> },
  { key: "fish", icon: "🐠", render: (id, done) => <PondGame lockedLetter={id} lockedLevel={6} lockedFishCount={6} rounds={1} onFinish={done} /> },
  { key: "balloon", icon: "🎈", render: (id, done) => <BalloonPop letterId={id} onDone={done} /> },
  { key: "build", icon: "🧩", render: (id, done) => <BuildLetter letterId={id} onDone={done} /> },
  { key: "trace", icon: "✍️", render: (id, done) => <TraceStep letterId={id} onDone={done} /> },
  { key: "write", icon: "✏️", render: (id, done) => <FreeWriteStep letterId={id} onDone={done} /> },
];

type Phase = "playing" | "transition" | "done";

export default function LetterAdventure({ letterId }: { letterId: string }) {
  const letter = getLetter(letterId);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const guardRef = useRef(false); // one onDone per step
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  // Next letter in the set (wraps around) — for the "next letter" button.
  const idx = LETTERS.findIndex((l) => l.id === letterId);
  const nextLetter = LETTERS[(idx + 1) % LETTERS.length];

  const finishStep = useCallback(() => {
    if (guardRef.current) return;
    guardRef.current = true;
    stopWinLoseSounds();
    setPhase("transition");
    timers.current.push(
      window.setTimeout(() => {
        setStep((s) => {
          const next = s + 1;
          if (next >= STEPS.length) {
            setPhase("done");
            unlockAudio();
            playWinSound(); // big clap on finishing the whole letter
            return s;
          }
          setPhase("playing");
          guardRef.current = false;
          return next;
        });
      }, 900)
    );
  }, []);

  const restart = useCallback(() => {
    stopWinLoseSounds();
    guardRef.current = false;
    setStep(0);
    setPhase("playing");
  }, []);

  const completedCount = phase === "done" ? STEPS.length : step + (phase === "transition" ? 1 : 0);

  return (
    <div className="adv">
      {/* Floating progress bar */}
      <div className="advBar">
        <Link href="/" className="advHome" aria-label="घर" onClick={() => stopWinLoseSounds()}>
          🏠
        </Link>
        <span className="advBarLetter">{letter.char}</span>
        <div className="advTrack">
          {STEPS.map((s, i) => {
            const done = i < completedCount;
            const cur = i === step && phase !== "done";
            return (
              <span key={s.key} className={`advDot${done ? " done" : ""}${cur ? " cur" : ""}`}>
                {done ? "✓" : s.icon}
              </span>
            );
          })}
        </div>
      </div>

      {/* The current stop (full-screen game / activity) */}
      {phase !== "done" && (
        <div key={step} className="advStage">
          {STEPS[step].render(letterId, finishStep)}
        </div>
      )}

      {/* Quick "well done" flash between stops */}
      {phase === "transition" && (
        <div className="advFlash">
          <div className="advFlashInner">⭐ शाबाश!</div>
        </div>
      )}

      {/* Finished the whole letter */}
      {phase === "done" && (
        <div className="advDone" style={{ background: "linear-gradient(#fff6da 0%, #ffe1a8 100%)" }}>
          <div className="overlayCard" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 54 }}>🏆</div>
            <div className="advDoneChar">{letter.char}</div>
            <div className="overlayTitle">शाबाश!</div>
            <p style={{ fontSize: 17, color: "#0a3d57", margin: "2px 0 16px" }}>
              तुमने “{letter.char}” की सैर पूरी कर ली!
            </p>
            <Link className="bigButton" href={`/letter/${nextLetter.id}`} onClick={() => stopWinLoseSounds()}>
              ▶ अगला अक्षर “{nextLetter.char}”
            </Link>
            <button type="button" className="bigButton blue" style={{ marginTop: 12 }} onClick={restart}>
              🔁 फिर से
            </button>
            <Link href="/" className="overlayLink" onClick={() => stopWinLoseSounds()}>
              🏠 घर
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
