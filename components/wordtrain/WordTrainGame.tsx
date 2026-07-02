"use client";

// ---------------------------------------------------------------------------
// HINDI WORD TRAIN GAME
// ---------------------------------------------------------------------------
// Blend letters into a complete spoken word, in the right order.
//
// A picture + spoken word appear at the top (the written word is hidden). A
// train TRACK shows one shadow "coach" per letter, so the child knows how many
// letters the word has. Eight letter COACHES sit at the bottom (one per letter,
// an unlimited supply). The child DRAGS the coaches onto the track in order:
//   - correct next letter -> the coach clicks into place and says its sound.
//   - wrong letter         -> it drops back to the bottom (the slot shakes red).
// When the last coach is placed, the train chugs off and the word is blended
// aloud. A session is a handful of words; finishing links back to PadhaiPal.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildSession, TrainWord } from "@/lib/wordtrain/words";
import { LETTERS, getLetter } from "@/lib/letters";
import EraserIcon from "@/components/shared/EraserIcon";
import {
  playLetterSound,
  playWordSound,
  playWinSound,
  unlockAudio,
} from "@/lib/audio";

const PADHAIPAL_URL = "https://wa.me/918528097842";

// A cheerful, distinct colour per letter so each coach is recognisable. White
// text reads on all of these.
const COACH_COLOR: Record<string, string> = {
  ba: "#e8568f",
  sa: "#3a9bd9",
  pa: "#f0883c",
  ra: "#8b5cf6",
  ta: "#23b56b",
  ka: "#d99b00",
  cha: "#ff6b4a",
  la: "#0ca6a0",
};

type Phase = "start" | "playing" | "done";

// The top picture for a word. Most words are a plain emoji, but a couple need
// help reading clearly: रबर uses a drawn Indian eraser, and पलक adds an arrow
// pointing at the eyelid (so the eye emoji isn't mistaken for "eye").
function WordPicture({ word }: { word: TrainWord }) {
  if (word.id === "rabar") return <EraserIcon size={104} />;
  if (word.id === "palak") {
    return (
      <span className="palakPic">
        <span className="palakEye">👁️</span>
        <svg className="palakArrow" viewBox="0 0 100 100" aria-hidden="true">
          <path
            d="M86 14 L52 41"
            stroke="#e23b3b"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M52 41 L66 38 L60 52 Z" fill="#e23b3b" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="pictureEmoji trainEmoji"
      style={word.id === "kab" ? { fontSize: 60 } : undefined}
    >
      {word.emoji}
    </span>
  );
}

export default function WordTrainGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [session, setSession] = useState<TrainWord[]>([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]); // letter ids on the track
  const [moving, setMoving] = useState(false); // train chugging off after a win
  const [wrongSlot, setWrongSlot] = useState(false); // shake the next slot red

  // Floating "ghost" coach that follows the finger while dragging.
  const [drag, setDrag] = useState<{ letterId: string; x: number; y: number } | null>(
    null
  );
  const dragRef = useRef<{
    letterId: string;
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false); // lock input while a word is resolving
  const timers = useRef<number[]>([]);

  const word = session[wordIdx];
  const isLast = wordIdx >= session.length - 1;

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  };
  useEffect(() => () => clearTimers(), []);

  // ---- load a word (picture appears, then the word is spoken) -------------
  const loadWord = useCallback((sess: TrainWord[], idx: number) => {
    setWordIdx(idx);
    setPlaced([]);
    setMoving(false);
    setWrongSlot(false);
    busyRef.current = true; // locked during the intro
    const w = sess[idx];
    // small cadence: picture shows, brief pause, then the word is spoken.
    later(() => {
      playWordSound(w.audio);
      busyRef.current = false;
    }, 500);
  }, []);

  const startGame = useCallback(() => {
    clearTimers();
    const sess = buildSession();
    setSession(sess);
    setPhase("playing");
    loadWord(sess, 0);
  }, [loadWord]);

  // ---- replay the spoken word when the picture is tapped ------------------
  const replay = useCallback(() => {
    if (!word || moving) return;
    unlockAudio();
    playWordSound(word.audio);
  }, [word, moving]);

  // ---- a coach was dropped: place it if it is the correct next letter -----
  const tryPlace = useCallback(
    (letterId: string) => {
      if (!word || busyRef.current || moving) return;
      const slot = placed.length;
      const correct = letterId === word.letters[slot];
      if (!correct) {
        // wrong -> it drops back to the bottom; flag the slot to shake red.
        setWrongSlot(true);
        later(() => setWrongSlot(false), 480);
        return;
      }

      const next = [...placed, letterId];
      setPlaced(next);
      unlockAudio();
      playLetterSound(getLetter(letterId).audio); // "clicks into place + sound"

      if (next.length < word.letters.length) return;

      // Whole word complete -> the train chugs off and blends the word aloud.
      busyRef.current = true;
      later(() => {
        setMoving(true);
        playWordSound(word.audio); // blend the word
      }, 700);

      // Then advance to the next word (or finish the session).
      later(() => {
        if (isLast) {
          playWinSound(); // applause
          setPhase("done");
        } else {
          loadWord(session, wordIdx + 1);
        }
      }, 2200);
    },
    [word, placed, moving, isLast, session, wordIdx, loadWord]
  );

  // ---- drag handlers (Pointer Events + capture) ---------------------------
  const onCoachDown = useCallback(
    (e: React.PointerEvent, letterId: string) => {
      if (phase !== "playing" || busyRef.current || moving) return;
      e.preventDefault();
      unlockAudio();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      dragRef.current = {
        letterId,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
      };
      setDrag({ letterId, x: e.clientX, y: e.clientY });
    },
    [phase, moving]
  );

  const onCoachMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    setDrag({ letterId: d.letterId, x: e.clientX, y: e.clientY });
  }, []);

  const onCoachUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      dragRef.current = null;
      setDrag(null);

      // Two ways to play, both land the coach in the next slot:
      //   1) DRAG it over the track (a generous hit area for little fingers), or
      //   2) just TAP the coach (released roughly where it was pressed).
      const r = trackRef.current?.getBoundingClientRect();
      const over =
        !!r &&
        e.clientX >= r.left - 24 &&
        e.clientX <= r.right + 24 &&
        e.clientY >= r.top - 60 &&
        e.clientY <= r.bottom + 40;
      const moved = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
      const isTap = moved < 12;
      if (over || isTap) tryPlace(d.letterId);
    },
    [tryPlace]
  );

  // First word: gently pulse the correct next coach as a demo.
  const hintLetter =
    phase === "playing" && wordIdx === 0 && !moving && word
      ? word.letters[placed.length]
      : null;

  return (
    <div className="trainApp">
      <Link href="/" className="cornerLink" aria-label="games home">
        🏠
      </Link>
      {phase !== "start" && (
        <div className="blocksLevelPill">
          शब्द {Math.min(wordIdx + 1, session.length)}/{session.length}
        </div>
      )}

      {/* ---- Picture + spoken word (written word stays hidden) ---- */}
      {phase === "playing" && word && (
        <div className="trainTop">
          <div className="pictureCard trainPicture">
            <WordPicture word={word} />
          </div>
          <button type="button" className="soundBtn" onClick={replay} aria-label="सुनो">
            🔊 सुनो
          </button>
        </div>
      )}

      {/* ---- Train track: engine + one shadow coach per letter ---- */}
      {phase === "playing" && word && (
        <div className="trainTrackArea">
          <div className="trainTrackWrap">
            <div className={`trainSet ${moving ? "moving" : ""}`} key={wordIdx}>
              <div className="engine">🚂</div>
              <div className="coaches" ref={trackRef}>
                {word.letters.map((lid, i) => {
                  const filled = i < placed.length;
                  const isNext = i === placed.length;
                  const cls = [
                    "slot",
                    filled ? "filled" : "shadow",
                    !filled && isNext && wrongSlot ? "wrong" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <div
                      key={i}
                      className={cls}
                      style={filled ? { background: COACH_COLOR[lid] } : undefined}
                    >
                      {filled && (
                        <span className="coachChar">{getLetter(lid).char}</span>
                      )}
                      <span className="wheel wheelL" />
                      <span className="wheel wheelR" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rail" />
          </div>
        </div>
      )}

      {/* ---- The eight letter coaches at the bottom (drag source) ---- */}
      {phase === "playing" && (
        <div className="coachTray">
          {LETTERS.map((l) => {
            const dragging = drag?.letterId === l.id;
            const cls = [
              "trayCoach",
              dragging ? "dragging" : "",
              hintLetter === l.id ? "hint" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={l.id}
                type="button"
                className={cls}
                style={{ background: COACH_COLOR[l.id] }}
                aria-label={`coach ${l.char}`}
                onPointerDown={(e) => onCoachDown(e, l.id)}
                onPointerMove={onCoachMove}
                onPointerUp={onCoachUp}
                onPointerCancel={onCoachUp}
              >
                <span className="coachChar">{l.char}</span>
                <span className="wheel wheelL" />
                <span className="wheel wheelR" />
              </button>
            );
          })}
        </div>
      )}

      {/* ---- The floating coach that follows the finger ---- */}
      {drag && (
        <div
          className="dragGhost"
          style={{
            left: drag.x,
            top: drag.y,
            background: COACH_COLOR[drag.letterId],
          }}
        >
          <span className="coachChar">{getLetter(drag.letterId).char}</span>
          <span className="wheel wheelL" />
          <span className="wheel wheelR" />
        </div>
      )}

      {/* ---- Overlays ---- */}
      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🚂</div>
            <div className="overlayTitle">रेल गाड़ी</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              अक्षरों को सही क्रम में पटरी पर ले जाओ
            </p>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockAudio();
                startGame();
              }}
            >
              ▶ खेलो
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🏆</div>
            <div className="overlayTitle">शाबाश!</div>
            <div style={{ fontSize: 18, color: "#0a3d57", margin: "2px 0 16px" }}>
              सभी शब्द पूरे!
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
