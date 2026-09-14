"use client";

// ---------------------------------------------------------------------------
// MATRA ADVENTURE — a guided journey through one matra (vowel sign).
// ---------------------------------------------------------------------------
// For a single matra (say ा) the child travels through a short series of games,
// all fixing that matra and varying the consonant, so they learn that ा makes
// का, पा, ता … A progress bar floats across the top the whole time. Each game
// hands back with onDone/onFinish; a quick "शाबाश!" flash flows into the next.
//
//   ✨ Matra Maker (drag the matra on) → 🫧 Matra Fish (catch its syllables)
//   → 🧺 Matra Basket (sort its syllables)
//
// Reuses the same floating progress-bar styles as the letter adventure.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import MatraGame from "@/components/matra/MatraGame";
import MatraFish from "@/components/matra/MatraFish";
import MatraBasket from "@/components/matra/MatraBasket";
import { MATRAS, getMatra, matraChip } from "@/lib/matras";
import { playWinSound, stopWinLoseSounds, unlockAudio } from "@/lib/audio";
import { stopTts } from "@/lib/tts";

type StepDef = {
  key: string;
  icon: string;
  pad?: boolean; // wrap with top padding so the floating bar doesn't cover it
  render: (matraId: string, done: () => void) => React.ReactNode;
};

const STEPS: StepDef[] = [
  { key: "maker", icon: "✨", render: (id, done) => <MatraGame lockedMatra={id} rounds={4} onFinish={done} /> },
  { key: "fish", icon: "🫧", pad: true, render: (id, done) => <MatraFish matraId={id} onDone={done} /> },
  { key: "basket", icon: "🧺", pad: true, render: (id, done) => <MatraBasket matraId={id} onDone={done} /> },
];

type Phase = "playing" | "transition" | "done";

export default function MatraAdventure({ matraId }: { matraId: string }) {
  const matra = getMatra(matraId);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const guardRef = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const idx = MATRAS.findIndex((m) => m.id === matraId);
  const nextMatra = MATRAS[(idx + 1) % MATRAS.length];

  const finishStep = useCallback(() => {
    if (guardRef.current) return;
    guardRef.current = true;
    stopWinLoseSounds();
    stopTts();
    setPhase("transition");
    timers.current.push(
      window.setTimeout(() => {
        setStep((s) => {
          const next = s + 1;
          if (next >= STEPS.length) {
            setPhase("done");
            unlockAudio();
            playWinSound();
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
    stopTts();
    guardRef.current = false;
    setStep(0);
    setPhase("playing");
  }, []);

  const completedCount = phase === "done" ? STEPS.length : step + (phase === "transition" ? 1 : 0);

  return (
    <div className="adv">
      <div className="advBar">
        <Link href="/" className="advHome" aria-label="घर" onClick={() => { stopWinLoseSounds(); stopTts(); }}>
          🏠
        </Link>
        <span className="advBarLetter">{matraChip(matra)}</span>
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

      {phase !== "done" && (
        <div key={step} className="advStage">
          {STEPS[step].pad ? (
            <div className="advStepPad">{STEPS[step].render(matraId, finishStep)}</div>
          ) : (
            STEPS[step].render(matraId, finishStep)
          )}
        </div>
      )}

      {phase === "transition" && (
        <div className="advFlash">
          <div className="advFlashInner">⭐ शाबाश!</div>
        </div>
      )}

      {phase === "done" && (
        <div className="advDone" style={{ background: "linear-gradient(#e9fff9 0%, #bff0e6 100%)" }}>
          <div className="overlayCard" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 54 }}>🏆</div>
            <div className="advDoneChar">{matraChip(matra)}</div>
            <div className="overlayTitle">शाबाश!</div>
            <p style={{ fontSize: 17, color: "#0a3d57", margin: "2px 0 16px" }}>
              तुमने “{matra.sign}” मात्रा की सैर पूरी कर ली!
            </p>
            <Link className="bigButton" href={`/matra/${nextMatra.id}`} onClick={() => { stopWinLoseSounds(); stopTts(); }}>
              ▶ अगली मात्रा “{matraChip(nextMatra)}”
            </Link>
            <button type="button" className="bigButton blue" style={{ marginTop: 12 }} onClick={restart}>
              🔁 फिर से
            </button>
            <Link href="/" className="overlayLink" onClick={() => { stopWinLoseSounds(); stopTts(); }}>
              🏠 घर
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
