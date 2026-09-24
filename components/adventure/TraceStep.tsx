"use client";

// ---------------------------------------------------------------------------
// TRACE STEP — one stop in the letter adventure: trace THIS letter once.
// ---------------------------------------------------------------------------
// A slim wrapper around the Lekhan TraceSlate (order-enforced stroke tracing),
// scoped to a single letter. Shows the picture + letter + a Listen button, then
// the chalkboard slate. When the child finishes tracing every stroke in order,
// we celebrate briefly and call onDone().
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import TraceSlate from "@/components/lekhan/TraceSlate";
import { getLetterStrokes } from "@/lib/lekhan/hindiStrokes";
import { getLetter } from "@/lib/letters";
import LattuIcon from "@/components/shared/LattuIcon";
import ThelaIcon from "@/components/shared/ThelaIcon";
import { playBingSound, unlockAudio } from "@/lib/audio";
import { speakLetterWord } from "@/lib/letterVoice";

interface Props {
  letterId: string;
  onDone: () => void;
}

export default function TraceStep({ letterId, onDone }: Props) {
  const letter = getLetter(letterId);
  const strokes = getLetterStrokes(letterId);
  const [size, setSize] = useState(300);
  const doneRef = useRef(false);
  const introRef = useRef(false);

  // Fit the square slate to the viewport.
  useEffect(() => {
    const f = () => setSize(Math.min(window.innerWidth - 40, 340, window.innerHeight - 260));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  // Speak the picture+letter prompt once when the step opens.
  useEffect(() => {
    if (introRef.current) return;
    introRef.current = true;
    unlockAudio();
    const t = window.setTimeout(() => speakLetterWord(letterId), 350);
    return () => window.clearTimeout(t);
  }, [letterId]);

  const handleComplete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    playBingSound();
    window.setTimeout(() => onDone(), 700);
  }, [onDone]);

  return (
    <div className="advTrace">
      <div className="advPrompt">
        <div className="advPromptPic">
          {letterId === "la" ? (
            <LattuIcon size={62} />
          ) : letterId === "ttha" ? (
            <ThelaIcon size={62} />
          ) : (
            <span style={{ fontSize: 56 }}>{letter.emoji}</span>
          )}
        </div>
        <span className="advPromptChar">{letter.char}</span>
        <button
          type="button"
          className="soundBtn soundBtn--compact"
          onClick={() => {
            unlockAudio();
            speakLetterWord(letterId);
          }}
          aria-label="सुनो"
        >
          🔊 सुनो
        </button>
      </div>
      <div className="advTraceSlate">
        <TraceSlate
          key={letterId}
          strokes={strokes}
          width={size}
          height={size}
          onComplete={handleComplete}
        />
      </div>
      <p className="advHint">उँगली से अक्षर बनाओ ✏️</p>
    </div>
  );
}
