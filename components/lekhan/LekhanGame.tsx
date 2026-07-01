"use client";

// ---------------------------------------------------------------------------
// LEKHAN (WRITING) GAME
// ---------------------------------------------------------------------------
// The child writes letters (L1-L3) then 2-letter words (L4-L5) on a slate.
// A picture (+ letter/word, depending on the level) shows at the top and its
// sound plays. The slate validates the tracing/writing (see Slate.tsx). Each
// level finishes after 5 items, then applause; the last screen links to
// PadhaiPal. Letter/word order is randomised each level.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Slate from "./Slate";
import { LEKHAN_LEVELS, TOTAL_LEKHAN_LEVELS } from "@/lib/lekhan/levels";
import { LETTERS, getLetter, letterWordAudio } from "@/lib/letters";
import { BLOCK_WORDS } from "@/lib/blocks/words";
import LattuIcon from "@/components/shared/LattuIcon";
import {
  playLetterSound,
  playWordSound,
  playWinSound,
  playBingSound,
  stopWinLoseSounds,
  unlockAudio,
} from "@/lib/audio";

const PADHAIPAL_URL = "https://wa.me/918528097842";

// The closed vocabulary for the word levels — the drawing is recognised against
// these and only accepted if the nearest match is the target word.
const WORD_CANDIDATES = BLOCK_WORDS.map((w) => w.word);

type Phase = "start" | "playing" | "levelComplete" | "allDone";

interface Item {
  write: string; // text to write on the slate
  emoji: string; // picture
  glyph: string; // the letter / word shown at top (when visible)
  isLa: boolean; // draw the lattu SVG instead of an emoji
  kab: boolean; // the kab picture needs a smaller font
  play: () => void; // its spoken audio
}

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSequence(mode: "letter" | "word", items: number): Item[] {
  if (mode === "letter") {
    const ids = shuffle(LETTERS.map((l) => l.id)).slice(0, items);
    return ids.map((id) => {
      const l = getLetter(id);
      return {
        write: l.char,
        emoji: l.emoji,
        glyph: l.char,
        isLa: id === "la",
        kab: false,
        play: () => playLetterSound(letterWordAudio(id)),
      };
    });
  }
  const ws = shuffle([...BLOCK_WORDS]).slice(0, items);
  return ws.map((w) => ({
    write: w.word,
    emoji: w.emoji,
    glyph: w.word,
    isLa: false,
    kab: w.id === "kab",
    play: () => playWordSound(w.audio),
  }));
}

export default function LekhanGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [level, setLevel] = useState(1);
  const [seq, setSeq] = useState<Item[]>([]);
  const [itemIdx, setItemIdx] = useState(0);
  const [vw, setVw] = useState(390);
  const introRef = useRef("");

  const cfg = LEKHAN_LEVELS[level - 1];
  const isLastLevel = level >= TOTAL_LEKHAN_LEVELS;
  const item = seq[itemIdx];

  // slate size from the viewport
  useEffect(() => {
    const f = () => setVw(Math.min(window.innerWidth, 460));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  const slateW = cfg.shape === "square" ? Math.min(vw - 44, 320) : Math.min(vw - 28, 400);
  const slateH = cfg.shape === "square" ? slateW : Math.round(slateW * 0.6);

  const startLevel = useCallback((levelNumber: number) => {
    const lvl = LEKHAN_LEVELS[levelNumber - 1];
    setLevel(levelNumber);
    setSeq(buildSequence(lvl.mode, lvl.items));
    setItemIdx(0);
    setPhase("playing");
  }, []);

  const newGame = useCallback(() => startLevel(1), [startLevel]);

  // play each new item's sound (once), a beat after it appears
  useEffect(() => {
    if (phase !== "playing" || !item) return;
    const key = `${level}-${itemIdx}`;
    if (introRef.current === key) return;
    introRef.current = key;
    const t = window.setTimeout(() => item.play(), 450);
    return () => window.clearTimeout(t);
  }, [phase, level, itemIdx, item]);

  const onComplete = useCallback(() => {
    const next = itemIdx + 1;
    if (next >= seq.length) {
      playWinSound(); // applause
      setPhase(isLastLevel ? "allDone" : "levelComplete");
    } else {
      playBingSound();
      setItemIdx(next);
    }
  }, [itemIdx, seq.length, isLastLevel]);

  return (
    <div className="lekhanApp" style={{ background: cfg.bg }}>
      <Link href="/" className="cornerLink" aria-label="games home">
        🏠
      </Link>
      {phase !== "start" && (
        <div className="blocksLevelPill">
          स्तर {level}/{TOTAL_LEKHAN_LEVELS}
        </div>
      )}

      {phase === "playing" && item && (
        <>
          {/* Top: the picture, and (when the level shows it) the letter/word */}
          <div className="lekhanTop">
            <button
              type="button"
              className="lekhanPrompt"
              onClick={() => {
                unlockAudio();
                item.play();
              }}
              aria-label="सुनो"
            >
              {item.isLa ? (
                <LattuIcon size={84} />
              ) : (
                <span className="lekhanEmoji" style={item.kab ? { fontSize: 66 } : undefined}>
                  {item.emoji}
                </span>
              )}
              {cfg.showGlyph && <span className="lekhanGlyph">{item.glyph}</span>}
              <span className="lekhanHint">🔊</span>
            </button>
            <div className="lekhanProgress">
              {seq.map((_, i) => (
                <span key={i} className={`lekhanDot ${i < itemIdx ? "done" : i === itemIdx ? "cur" : ""}`} />
              ))}
            </div>
          </div>

          {/* The slate */}
          <div className="lekhanSlateWrap">
            <Slate
              key={`${level}-${itemIdx}`}
              text={item.write}
              showGuide={cfg.showGuide}
              width={slateW}
              height={slateH}
              onComplete={onComplete}
              recognizeAgainst={cfg.mode === "word" ? WORD_CANDIDATES : undefined}
            />
          </div>
        </>
      )}

      {/* ---- Overlays ---- */}
      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">✍️</div>
            <div className="overlayTitle">लेखन खेल</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              उंगली से अक्षर बनाना सीखो
            </p>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockAudio();
                newGame();
              }}
            >
              ▶ खेलो
            </button>
            <Link href="/" className="overlayLink">
              🏠 घर
            </Link>
          </div>
        </div>
      )}

      {phase === "levelComplete" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🎉</div>
            <div className="overlayTitle">शाबाश!</div>
            <div style={{ fontSize: 18, color: "#0a3d57", margin: "2px 0 16px" }}>
              स्तर {level} पूरा!
            </div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockAudio();
                stopWinLoseSounds();
                startLevel(level + 1);
              }}
            >
              ▶ अगला स्तर
            </button>
          </div>
        </div>
      )}

      {phase === "allDone" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🏆</div>
            <div className="overlayTitle">शाबाश!</div>
            <div style={{ fontSize: 18, color: "#0a3d57", margin: "2px 0 16px" }}>
              सभी स्तर पूरे!
            </div>
            <a className="bigButton" href={PADHAIPAL_URL}>
              पाठ पर जाएं
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
