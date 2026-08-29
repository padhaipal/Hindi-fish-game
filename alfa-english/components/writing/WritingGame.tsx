"use client";

// ---------------------------------------------------------------------------
// WRITING GAME — trace the letter.
// ---------------------------------------------------------------------------
// The child works through a writing lesson's letters (shuffled). For each one
// the top shows the ALfA PICTURE the letter is taught by (e.g. a -> apple), a
// "Listen" button that speaks the word, and the target lowercase letter (blue
// for a vowel, red for a consonant). Below is a chalk SLATE showing the letter
// as a faint guide to trace with a finger (coverage only — see TraceSlate).
// Trace enough of it -> the slate flashes green, the word is spoken, a ding
// plays, and the next letter appears. After the last letter -> a win overlay.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import TraceSlate from "./TraceSlate";
import LetterPicture from "@/components/shared/LetterPicture";
import SpeakerIcon from "@/components/shared/SpeakerIcon";
import { getLetter, Letter } from "@/lib/letters";
import { getWritingLesson, WRITING_LESSONS } from "@/lib/lessons";
import { say, stopSpeech, primeSpeech } from "@/lib/speech";
import { dingCorrect, chimeWin, unlockSfx } from "@/lib/sfx";

type Phase = "start" | "playing" | "won";

function shuffle<T>(a: T[]): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function WritingGame({ lesson }: { lesson: number }) {
  const cfg = getWritingLesson(lesson);
  const ids = cfg?.letters ?? [];
  const bg = cfg?.bg;
  const nextLesson = WRITING_LESSONS.find((l) => l.n > lesson);

  const [phase, setPhase] = useState<Phase>("start");
  const [seq, setSeq] = useState<Letter[]>([]);
  const [idx, setIdx] = useState(0);
  const [vw, setVw] = useState(390);
  const advancing = useRef(false);
  const introKey = useRef("");

  const item = seq[idx];

  // slate size from the viewport (square, single letter)
  useEffect(() => {
    const f = () => setVw(Math.min(window.innerWidth, 460));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  const slateW = Math.min(vw - 32, 360);
  const slateH = slateW;

  const startGame = useCallback(() => {
    setSeq(shuffle(ids.map((id) => getLetter(id))));
    setIdx(0);
    advancing.current = false;
    setPhase("playing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson]);

  // Speak each new letter's word a beat after it appears.
  useEffect(() => {
    if (phase !== "playing" || !item) return;
    const key = `${idx}-${item.id}`;
    if (introKey.current === key) return;
    introKey.current = key;
    const t = window.setTimeout(() => say(item.word), 450);
    return () => window.clearTimeout(t);
  }, [phase, idx, item]);

  // Applause once the win overlay shows.
  useEffect(() => {
    if (phase === "won") chimeWin();
  }, [phase]);

  const handleComplete = useCallback(() => {
    if (advancing.current || !item) return;
    advancing.current = true;
    dingCorrect();
    say(item.word);
    window.setTimeout(() => {
      advancing.current = false;
      if (idx + 1 >= seq.length) {
        setPhase("won");
      } else {
        setIdx((i) => i + 1);
      }
    }, 950);
  }, [item, idx, seq.length]);

  const listen = useCallback(() => {
    unlockSfx();
    if (item) say(item.word);
  }, [item]);

  return (
    <div className="lekhanApp" style={bg ? { background: bg } : undefined}>
      {phase !== "start" && <div className="blocksLevelPill">Lesson {lesson}</div>}

      {phase === "playing" && item && (
        <>
          <div className="lekhanTop">
            <button type="button" className="lekhanPrompt" onClick={listen} aria-label={`Listen: ${item.word}`}>
              <LetterPicture letter={item} size={84} className="lekhanEmoji" />
              <span
                className="lekhanGlyph"
                style={{ color: item.vowel ? "#2b7fd6" : "#e2483b" }}
              >
                {item.char}
              </span>
            </button>
            <button type="button" className="soundBtn" onClick={listen} aria-label="Listen">
              <SpeakerIcon /> Listen
            </button>
            <div className="lekhanProgress">
              {seq.map((_, i) => (
                <span key={i} className={`lekhanDot ${i < idx ? "done" : i === idx ? "cur" : ""}`} />
              ))}
            </div>
          </div>

          <div className="lekhanSlateWrap">
            <TraceSlate
              key={`${idx}-${item.id}`}
              letter={item.char}
              width={slateW}
              height={slateH}
              onComplete={handleComplete}
            />
          </div>
        </>
      )}

      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">✏️</div>
            <div className="overlayTitle">Trace the letter</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              Follow the letter with your finger
            </p>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockSfx();
                primeSpeech();
                startGame();
              }}
            >
              ▶ Play
            </button>
          </div>
        </div>
      )}

      {phase === "won" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🏆</div>
            <div className="overlayTitle">Well done!</div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                stopSpeech();
                startGame();
              }}
            >
              ▶ Play again
            </button>
            <a className="bigButton" href="/" style={{ marginTop: 12 }}>
              🏠 All games
            </a>
            {nextLesson && (
              <a className="overlayLink" href={`/writing/lesson-${nextLesson.n}`}>
                Next lesson →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
