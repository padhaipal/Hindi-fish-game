# 🐟 Hindi Fish Game

A simple, bright, mobile-first **Hindi letter recognition** game for young /
low-literacy children, built for **PadhaiPal**.

A target Hindi letter shows at the top of a cheerful pond. Fish swim around, each
carrying one letter. The child taps **every fish carrying the target letter**
before the timer bar runs out.

- ✅ Correct tap → fish splashes away, the letter sound plays, a coin/star pops.
- ❌ Wrong tap → the fish stays, shakes gently, and a soft "baaap" plays.

The 8 practised letters are: **ब स प र त क च ल**

## ✨ Features

- **No login, no backend** — pure client-side, works offline once loaded.
- **Mobile-first & touch-friendly** — big letters, big tap targets, locked zoom.
- **Level progression** — early levels: fewer/slower fish + easy distractors;
  later levels: more/faster fish + look-alike & sound-alike distractor letters.
- **Safe audio fallback** — if a sound file is missing, a synthesized tone plays
  instead, so the game never breaks.
- **Low-end friendly** — fish motion is animated with `requestAnimationFrame`
  writing transforms directly to the DOM (no per-frame React re-renders).

## 🚀 Run it

```bash
npm install
npm run dev      # http://localhost:3000
# or
npm run build && npm run start
```

## 🛠️ Where to edit things

Everything you'll commonly want to tweak is small and commented:

| What | File |
| --- | --- |
| The Hindi letters + picture emoji + look/sound-alike hints | `lib/letters.ts` |
| Level difficulty (fish count, speed, time, distractors) | `lib/levels.ts` |
| How a round's fish are chosen + fish colours | `lib/round.ts` |
| Audio playback + safe fallback | `lib/audio.ts` |
| The game screen / fish / overlays | `components/PondGame.tsx`, `components/Fish.tsx` |
| Colours, sizes, animations | `app/globals.css` |

## 🏆 Scoring

- **🐟 (top-left)** — running count of correct fish caught; carries across
  levels, resets only on a fresh game. Wrong taps are never penalised here.
- **⭐ (top-right)** — the current level number.
- **End-of-level stars (1–3)** — start from how much time was left
  (>50% → 3, >20% → 2, else 1), then **lose one star per wrong tap**
  (minimum 1 for a win).
- **Losing** — running out of time **or** making 3 wrong taps in a level.

## 🖼️ Pictures

The picture beside the target letter is a big **emoji** (see `emoji` in
`lib/letters.ts`) — crisp on small screens and easy to change, no image files
needed. e.g. ब → 🦆 (बत्तख़), स → 🧼 (साबुन).

## 🔊 Audio

- `public/audio/letters/<id>.mp3` — one spoken letter per letter (`ba`, `sa`,
  `pa`, `ra`, `ta`, `ka`, `cha`, `la`). Played on the frozen round intro, on
  "सुनो", and on each correct catch.
- `public/audio/wrong-baap.mp3` — the soft "baaap" for a wrong tap.
- `public/audio/clap.mp3` — clapping/cheer when a level is won.
- `public/audio/wa-wa-wa.mp3` — sad "wa wa wa" when a level is lost.

If any file is missing, the game plays a gentle **synthesized tone** shaped to
match (so it never breaks). Drop in real recordings with the same filenames and
they're used automatically. See `public/audio/letters/README.md`.

## 🧱 Tech

Next.js (App Router) + React + TypeScript. No database, no auth, no tracking.
