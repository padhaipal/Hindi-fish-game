"use client";

// ---------------------------------------------------------------------------
// MATRA WRITE STEP — one stop in the matra adventure: write the matra.
// ---------------------------------------------------------------------------
// The consonant क is already on the slate; the child writes the matra onto it.
//   guided = true  → trace the matra inside a faint outline.
//   guided = false → write it freely (no outline, just a start dot).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import MatraWriteSlate from "@/components/matra/MatraWriteSlate";
import { getMatra, syllable } from "@/lib/matras";
import { primeTts, speakSyllable, stopTts } from "@/lib/tts";
import { playBingSound, unlockAudio } from "@/lib/audio";

const CONS = "क"; // the consonant the matra strokes were authored on

interface Props {
  matraId: string;
  guided: boolean;
  onDone: () => void;
}

export default function MatraWriteStep({ matraId, guided, onDone }: Props) {
  const matra = getMatra(matraId);
  const target = syllable(CONS, matra);
  const [size, setSize] = useState(300);
  const doneRef = useRef(false);
  const introRef = useRef(false);

  useEffect(() => {
    const f = () => setSize(Math.min(window.innerWidth - 40, 340, window.innerHeight - 260));
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
    return () => {
      window.clearTimeout(t);
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
      <div className="advPrompt">
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
        {guided ? `“${matra.sign}” मात्रा को लाइनों में बनाओ ✏️` : `अब खुद “${matra.sign}” मात्रा लिखो ✏️`}
      </p>
    </div>
  );
}
