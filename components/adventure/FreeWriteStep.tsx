"use client";

// ---------------------------------------------------------------------------
// FREE-WRITE STEP — the concluding stop in the letter adventure.
// ---------------------------------------------------------------------------
// A blank slate: the child writes the letter freely, from memory, with NO guide
// and NO enforced stroke order — the old Lekhan writing exercise. The Slate
// judges by coverage/accuracy of the letter shape (see components/lekhan/Slate).
// After a while a gentle "आगे बढ़ें" appears in case a young child is stuck.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import Slate from "@/components/lekhan/Slate";
import { getLetter } from "@/lib/letters";
import LattuIcon from "@/components/shared/LattuIcon";
import { playBingSound, unlockAudio } from "@/lib/audio";
import { speakLetterWord } from "@/lib/letterVoice";

const SKIP_AFTER_MS = 20000;

interface Props {
  letterId: string;
  onDone: () => void;
}

export default function FreeWriteStep({ letterId, onDone }: Props) {
  const letter = getLetter(letterId);
  const [size, setSize] = useState(300);
  const [showSkip, setShowSkip] = useState(false);
  const doneRef = useRef(false);
  const introRef = useRef(false);

  useEffect(() => {
    const f = () => setSize(Math.min(window.innerWidth - 40, 340, window.innerHeight - 280));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  useEffect(() => {
    if (introRef.current) return;
    introRef.current = true;
    unlockAudio();
    const t = window.setTimeout(() => speakLetterWord(letterId), 350);
    const s = window.setTimeout(() => setShowSkip(true), SKIP_AFTER_MS);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(s);
    };
  }, [letterId]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    playBingSound();
    window.setTimeout(() => onDone(), 700);
  }, [onDone]);

  return (
    <div className="advTrace">
      <div className="advPrompt">
        <div className="advPromptPic">
          {letterId === "la" ? <LattuIcon size={62} /> : <span style={{ fontSize: 56 }}>{letter.emoji}</span>}
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
        <Slate key={letterId} text={letter.char} showGuide={false} width={size} height={size} onComplete={finish} />
      </div>
      <p className="advHint">अब खुद “{letter.char}” लिखो ✏️</p>
      {showSkip && (
        <button type="button" className="lekhanSkip" onClick={finish}>
          आगे बढ़ें →
        </button>
      )}
    </div>
  );
}
