"use client";

// ---------------------------------------------------------------------------
// ALfA ENGLISH — WORD TRAIN GAME
// ---------------------------------------------------------------------------
// Spell the pictured word by dragging letter-coaches onto the train, in order.
//
// A picture + spoken word appear at the top (the written word stays hidden). A
// train ENGINE 🚂 pulls one empty SLOT per letter of the word. Letter COACHES
// (the word's letters plus a couple of distractors, shuffled) sit in a tray at
// the bottom. The child DRAGS each coach onto the train in spelling order:
//   - correct next letter -> it clicks into place (a soft tick).
//   - wrong letter         -> the slot shakes red and buzzes (nothing sticks).
// When the last slot is filled, the word is spoken, the train chugs off, and
// the next word loads. Finishing the last word shows a win overlay.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { CVC_WORDS, CvcWord } from "@/lib/lessons";
import { say, stopSpeech, primeSpeech } from "@/lib/speech";
import { dingCorrect, buzzWrong, chimeWin, tick, unlockSfx } from "@/lib/sfx";
import SpeakerIcon from "@/components/shared/SpeakerIcon";

// How many words make up one game session.
const SESSION_LENGTH = 10;

// A cheerful, distinct colour per letter so each coach is recognisable. White
// text reads on all of these.
const PALETTE = [
  "#e8568f", "#3a9bd9", "#f0883c", "#8b5cf6", "#23b56b", "#d99b00",
  "#ff6b4a", "#0ca6a0", "#5b8def", "#c0504d", "#7cb342", "#ab47bc",
];
function coachColor(ch: string): string {
  let h = 0;
  for (let i = 0; i < ch.length; i++) h = (h * 31 + ch.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// Fisher–Yates shuffle (returns a new array).
function shuffle<T>(input: T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// One session: a shuffled handful of CVC words.
function buildSession(): CvcWord[] {
  return shuffle(CVC_WORDS).slice(0, Math.min(SESSION_LENGTH, CVC_WORDS.length));
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

// The coach tray for a word: its own (unique) letters plus two distractor
// letters that are not in the word, all shuffled for display.
function buildTray(word: string): string[] {
  const wordLetters = Array.from(new Set(word.split("")));
  const pool = ALPHABET.filter((c) => !wordLetters.includes(c));
  const distractors = shuffle(pool).slice(0, 2);
  return shuffle([...wordLetters, ...distractors]);
}

type Phase = "start" | "playing" | "done";

export default function WordTrainGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [session, setSession] = useState<CvcWord[]>([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]); // letters on the train
  const [moving, setMoving] = useState(false); // train chugging off after a win
  const [wrongSlot, setWrongSlot] = useState(false); // shake the next slot red
  const [tray, setTray] = useState<string[]>([]); // the coach letters for this word

  // Floating "ghost" coach that follows the finger while dragging.
  const [drag, setDrag] = useState<{ ch: string; x: number; y: number } | null>(null);
  const dragRef = useRef<{
    ch: string;
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
  const later = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  }, []);
  useEffect(() => () => clearTimers(), []);

  // ---- load a word (picture appears, then the word is spoken) --------------
  const loadWord = useCallback(
    (sess: CvcWord[], idx: number) => {
      setWordIdx(idx);
      setPlaced([]);
      setMoving(false);
      setWrongSlot(false);
      busyRef.current = true; // locked during the intro
      const w = sess[idx];
      setTray(buildTray(w.word));
      // small cadence: picture shows, brief pause, then the word is spoken.
      later(() => {
        say(w.word);
        busyRef.current = false;
      }, 500);
    },
    [later]
  );

  const startGame = useCallback(() => {
    clearTimers();
    const sess = buildSession();
    setSession(sess);
    setPhase("playing");
    loadWord(sess, 0);
  }, [loadWord]);

  // ---- replay the spoken word when the picture / Listen button is tapped ---
  const replay = useCallback(() => {
    if (!word || moving) return;
    say(word.word);
  }, [word, moving]);

  // ---- a coach was dropped: place it if it is the correct next letter ------
  const tryPlace = useCallback(
    (ch: string) => {
      if (!word || busyRef.current || moving) return;
      const letters = word.word.split("");
      const slot = placed.length;
      const correct = ch === letters[slot];
      if (!correct) {
        // wrong -> nothing sticks; flag the slot to shake red + buzz.
        setWrongSlot(true);
        buzzWrong();
        later(() => setWrongSlot(false), 480);
        return;
      }

      const next = [...placed, ch];
      setPlaced(next);
      tick(); // "clicks into place"

      if (next.length < letters.length) return;

      // Whole word complete -> speak it, chug off, then load the next word.
      busyRef.current = true;
      dingCorrect();
      later(() => {
        setMoving(true);
        say(word.word);
      }, 500);
      later(() => {
        if (isLast) {
          chimeWin();
          setPhase("done");
        } else {
          loadWord(session, wordIdx + 1);
        }
      }, 2200);
    },
    [word, placed, moving, isLast, session, wordIdx, loadWord, later]
  );

  // ---- drag handlers (Pointer Events + capture) ---------------------------
  const onCoachDown = useCallback(
    (e: React.PointerEvent, ch: string) => {
      if (phase !== "playing" || busyRef.current || moving) return;
      e.preventDefault();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      dragRef.current = {
        ch,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
      };
      setDrag({ ch, x: e.clientX, y: e.clientY });
    },
    [phase, moving]
  );

  const onCoachMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    setDrag({ ch: d.ch, x: e.clientX, y: e.clientY });
  }, []);

  const onCoachUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      dragRef.current = null;
      setDrag(null);

      // Two ways to play, both land the coach in the next slot:
      //   1) DRAG it over the train (a generous hit area for little fingers), or
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
      if (over || isTap) tryPlace(d.ch);
    },
    [tryPlace]
  );

  // First word: gently pulse the correct next coach as a demo.
  const letters = word ? word.word.split("") : [];
  const hintLetter =
    phase === "playing" && wordIdx === 0 && !moving && word
      ? letters[placed.length]
      : null;

  return (
    <div className="trainApp">
      <a className="cornerLink" href="/" aria-label="Home">
        ←
      </a>

      {phase !== "start" && (
        <div className="blocksLevelPill">
          Word {Math.min(wordIdx + 1, session.length)}/{session.length}
        </div>
      )}

      {/* ---- Picture + spoken word (written word stays hidden) ---- */}
      {phase === "playing" && word && (
        <div className="trainTop">
          <button
            type="button"
            className="pictureCard trainPicture"
            onClick={replay}
            aria-label="Listen to the word"
          >
            <span className="pictureEmoji trainEmoji">{word.emoji}</span>
          </button>
          <button type="button" className="soundBtn" onClick={replay} aria-label="Listen">
            <SpeakerIcon /> Listen
          </button>
        </div>
      )}

      {/* ---- Train: engine + one slot per letter ---- */}
      {phase === "playing" && word && (
        <div className="trainTrackArea">
          <div className="trainTrackWrap">
            <div className={`trainSet ${moving ? "moving" : ""}`} key={wordIdx}>
              <div className="engine">🚂</div>
              <div className="coaches" ref={trackRef}>
                {letters.map((ch, i) => {
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
                      style={filled ? { background: coachColor(ch) } : undefined}
                    >
                      {filled && <span className="coachChar">{ch}</span>}
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

      {/* ---- The letter coaches at the bottom (drag source) ---- */}
      {phase === "playing" && (
        <div className="coachTray">
          {tray.map((ch) => {
            const dragging = drag?.ch === ch;
            const cls = [
              "trayCoach",
              dragging ? "dragging" : "",
              hintLetter === ch ? "hint" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={ch}
                type="button"
                className={cls}
                style={{ background: coachColor(ch) }}
                aria-label={`coach ${ch}`}
                onPointerDown={(e) => onCoachDown(e, ch)}
                onPointerMove={onCoachMove}
                onPointerUp={onCoachUp}
                onPointerCancel={onCoachUp}
              >
                <span className="coachChar">{ch}</span>
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
          style={{ left: drag.x, top: drag.y, background: coachColor(drag.ch) }}
        >
          <span className="coachChar">{drag.ch}</span>
          <span className="wheel wheelL" />
          <span className="wheel wheelR" />
        </div>
      )}

      {/* ---- Start overlay ---- */}
      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🚂</div>
            <div className="overlayTitle">Word Train</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              Drag the letters onto the train to spell the word!
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

      {/* ---- Win overlay ---- */}
      {phase === "done" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🏆</div>
            <div className="overlayTitle">Well done!</div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockSfx();
                primeSpeech();
                stopSpeech();
                startGame();
              }}
            >
              ▶ Play again
            </button>
            <a className="bigButton" href="/" style={{ marginTop: 12 }}>
              🏠 All games
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
