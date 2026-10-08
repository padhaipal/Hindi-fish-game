"use client";

// The presenter's commentary: what the chatbot is doing and why, shown beside
// the phone on a wide screen and as a strip along the bottom on a phone.

import { useRef, useState } from "react";
import { SCRIPTS, type Lang, type NoteKey } from "@/lib/script";

// Where each moment sits in the learning loop (see `steps`).
const STAGE: Record<NoteKey, number> = {
  start: -1,
  intro: -1,
  word: 0,
  listening: -2, // keep the previous highlight
  didntHear: -2,
  letter: 1,
  picture: 2,
  association: 3,
  back: 4,
  firstTry: 0,
  win: 5,
};

export default function Commentary({ lang, note }: { lang: Lang | null; note: NoteKey }) {
  const [open, setOpen] = useState(true);
  const c = SCRIPTS[lang ?? "en"].commentary;
  const last = useRef(-1);
  const stage = STAGE[note] === -2 ? last.current : STAGE[note];
  last.current = stage;

  return (
    <aside className={`commentary${open ? "" : " closed"}`} aria-live="polite">
      <button className="cmToggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>💡 {c.title}</span>
        <span className="cmChevron">{open ? "▾" : "▴"}</span>
      </button>
      {open && (
        <div className="cmBody">
          {lang === "en" && c.hindiOnly && <div className="cmBadge">🇮🇳 {c.hindiOnly}</div>}
          <ol className="cmSteps">
            {c.steps.map((label, i) => (
              <li key={i} className={i === stage ? "now" : i < stage ? "done" : ""}>
                {label}
              </li>
            ))}
          </ol>
          <p key={note} className="cmNote">
            {c.notes[note]}
          </p>
        </div>
      )}
    </aside>
  );
}
