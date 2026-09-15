"use client";

// ---------------------------------------------------------------------------
// MATRA WRITE STEP — one stop in the matra adventure: write the matra.
// ---------------------------------------------------------------------------
// The consonant क is already on the slate; the child writes ONLY the matra onto
// it. The prompt spells this out — क (dimmed, "already done") + the matra = the
// syllable — so it's obvious you don't rewrite the whole letter.
//   guided = true  → fill the matra inside a clearly-defined outline.
//   guided = false → write it freely (no outline, just its highlighted spot).
// A gentle "आगे बढ़ें" appears after a while in case a young child is stuck.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import MatraWriteSlate from "@/components/matra/MatraWriteSlate";
import { getMatra, matraChip, syllable } from "@/lib/matras";
import { primeTts, speakSyllable, stopTts } from "@/lib/tts";
import { playBingSound, unlockAudio } from "@/lib/audio";

const CONS = "क"; // the consonant the matra strokes were authored on
const SKIP_AFTER_MS = 22000;

interface Props {
  matraId: string;
  guided: boolean;
  onDone: () => void;
}

export default function MatraWriteStep({ matraId, guided, onDone }: Props) {
  const matra = getMatra(matraId);
  const target = syllable(CONS, matra);
  const [size, setSize] = useState(300);
  const [showSkip, setShowSkip] = useState(false);
  const doneRef = useRef(false);
  const introRef = useRef(false);

  useEffect(() => {
    const f = () => setSize(Math.min(window.innerWidth - 40, 340, window.innerHeight - 288));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  useEffect(() => {
    if (introRef.current) return;
    introRef.current = true;
    unlockAudio();
    primeTts();
    const t = window.setTimeout(() => speakSyllable(target), 400);
    const s = window.setTimeout(() => setShowSkip(true), SKIP_AFTER_MS);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(s);
      stopTts();
    };
  }, [target]);

  const handleComplete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    playBingSound();
    window.setTimeout(() => onDone(), 700);
  }, [onDone]);

  return (
    <div className="advTrace">
      {/* क (already written, dimmed) + the matra = the syllable */}
      <div className="advPrompt">
        <span className="advPromptChar" style={{ opacity: 0.4 }}>{CONS}</span>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#0a3d57" }}>+</span>
        <span className="advPromptChar" style={{ color: "#c92a2a" }}>{matraChip(matra)}</span>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#0a3d57" }}>=</span>
        <span className="advPromptChar">{target}</span>
        <button
          type="button"
          className="soundBtn soundBtn--compact"
          onClick={() => {
            unlockAudio();
            primeTts();
            speakSyllable(target);
          }}
          aria-label="सुनो"
        >
          🔊 सुनो
        </button>
      </div>
      <p className="advHint" style={{ fontSize: 14, fontWeight: 700, color: "#0a6b57" }}>
        “{CONS}” पहले से बना है — तुम सिर्फ़ मात्रा लगाओ
      </p>
      <div className="advTraceSlate">
        <MatraWriteSlate
          key={`${matraId}-${guided}`}
          matraId={matraId}
          guided={guided}
          width={size}
          height={size}
          onComplete={handleComplete}
        />
      </div>
      <p className="advHint">
        {guided ? `“${matra.sign}” मात्रा को लाइनों में भरो ✏️` : `अब खुद “${matra.sign}” मात्रा लिखो ✏️`}
      </p>
      {showSkip && (
        <button type="button" className="lekhanSkip" onClick={handleComplete}>
          आगे बढ़ें →
        </button>
      )}
    </div>
  );
}
