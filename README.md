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
| The Hindi letters + look-alike / sound-alike hints | `lib/letters.ts` |
| Level difficulty (fish count, speed, time, distractors) | `lib/levels.ts` |
| How a round's fish are chosen | `lib/round.ts` |
| Audio playback + safe fallback | `lib/audio.ts` |
| The game screen / fish / overlays | `components/PondGame.tsx`, `components/Fish.tsx` |
| Colours, sizes, animations | `app/globals.css` |

## 🔊 Audio

Placeholder paths live in:

- `public/audio/letters/<id>.mp3` — one per letter (`ba`, `sa`, `pa`, `ra`,
  `ta`, `ka`, `cha`, `la`).
- `public/audio/wrong-baap.mp3` — the soft "baaap" for a wrong tap.

These are **placeholders**. Drop in real recordings with the same filenames and
they're used automatically. Until then, the game plays a gentle synthesized
tone. See `public/audio/letters/README.md`.

## 🧱 Tech

Next.js (App Router) + React + TypeScript. No database, no auth, no tracking.
