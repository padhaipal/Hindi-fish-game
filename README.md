# 🎮 Hindi Learning Games

Six simple, bright, mobile-first Hindi games for young / low-literacy children,
built for **PadhaiPal**. No login, no backend.

- **🐟 Fish game** (`/fish`) — tap the fish carrying the target letter.
- **🧩 Blocks game** (`/blocks`) — tap the two blocks that spell the pictured word.
- **🧠 Memory game** (`/memory`) — match each picture card with its letter card.
- **🚂 Word Train game** (`/wordtrain`) — drag the letter coaches onto the track,
  in order, to spell the pictured word.
- **🐸 Pond Hop game** (`/pondhop`) — hop across the river on the stones showing
  the target letter, before the timer runs out.
- **✍️ Lekhan game** (`/lekhan`) — trace / write the letters (then 2-letter words)
  on a slate.

All six share the 8 letters **ब स प र त क च ल** and their sounds
(`public/audio/letters`).

---

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
- **8 levels, one per letter** — each level targets a different one of the 8
  letters, in a **random order per player**. Difficulty ramps from 3 fish (1
  target) up to 10 fish (5 targets); the target always fills **half** the fish.
- **Win up / lose down** — winning advances a level; losing (timeout or 3 wrong
  taps) drops you back to the preceding level.
- **Finish screen** — clearing all 8 levels shows the PadhaiPal picture, plays a
  spoken message, and offers a **पाठ पर जाएं** button back to the app.
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
| Level difficulty (fish count, speed, time, distractors) | `lib/fish/levels.ts` |
| How a round's fish are chosen + fish colours | `lib/fish/round.ts` |
| Audio playback + safe fallback | `lib/audio.ts` |
| The game screen / fish / overlays | `components/fish/PondGame.tsx`, `components/fish/Fish.tsx` |
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
needed. e.g. ब → 🦆 (बत्तख़), स → 🧼 (साबुन). The one exception is ल (लट्टू),
drawn as a small SVG `LattuIcon` since no emoji is a real Indian spinning top.

The finish screen shows `public/images/shared/padhaipal.jpeg` (with a branded-badge
fallback if it isn't present yet).

## 🔊 Audio

- `public/audio/letters-word/<id>.mp3` — the **picture+letter** recording (the
  letter and its word, e.g. "ब … बत्तख़"). Played on the frozen round intro and
  on "सुनो".
- `public/audio/letters/<id>.mp3` — the **letter-only** sound (shared with the
  blocks game). Played when a fish is tapped.
- `public/audio/wrong-baap.mp3` — the soft "baaap" for a wrong tap.
- `public/audio/clap.mp3` — clapping/cheer when a level is won.
- `public/audio/wa-wa-wa.mp3` — sad "wa wa wa" when a level is lost.
- `public/audio/endgame-message.mp3` — spoken message on the finish screen.

If any file is missing, the game plays a gentle **synthesized tone** shaped to
match (so it never breaks). Drop in real recordings with the same filenames and
they're used automatically. See `public/audio/letters/README.md`.

## 🧱 Tech

Next.js (App Router) + React + TypeScript. No database, no auth, no tracking.

---

# 🧩 Hindi Blocks Game

A second game (route **`/blocks`**) for blending letters into words.

A picture (+ spoken word) appears at the top of a grid of **14 letter-blocks**.
The child taps the **two adjacent blocks** that spell the word:

- ✅ Correct → the pair flashes green, a clap plays, and they vanish; the blocks
  above **slide straight down** to make new pairs. Then the next picture appears.
- ❌ Wrong → the two tapped blocks flash red and stay.
- Tapping any block plays that **letter's** sound; tapping the **picture** replays
  the word. Clear all 14 blocks (7 words) to win.

## 🧠 Always winnable

Boards are **pre-generated offline and verified**, not made up at runtime:

- `scripts/generate-boards.mjs` builds boards by reverse-construction, then checks
  that they clear completely with a **unique** adjacent pair at every step (so the
  child's correct move is never ambiguous).
- 30 boards are baked into `lib/blocks/boards.ts`; one is chosen at random per game.
- Every board contains all 8 letters (त appears via **तप**).
- Re-run the generator if you change the words/rules:
  `node scripts/generate-boards.mjs > /tmp/boards.json` (then regenerate the data file).

## 🛠️ Where to edit

| What | File |
| --- | --- |
| Words (Devanagari, letters, picture emoji, audio) | `lib/blocks/words.ts` |
| Pre-generated winnable boards | `lib/blocks/boards.ts` (do not hand-edit) |
| Board generator | `scripts/generate-boards.mjs` |
| Grid gravity / adjacency rules | `lib/blocks/engine.ts` |
| Game screen / block tile | `components/blocks/BlocksGame.tsx`, `components/blocks/Block.tsx` |

## 🔊 Audio

- `public/audio/words/<id>.mp3` — the 12 spoken words (bus, cup, sar, ras, bal,
  chal, sab, kab, sach, par, pak, tap).
- Letter taps reuse the shared `public/audio/letters/<id>.mp3` sounds.
- Missing files fall back to a gentle synthesized tone, as in the fish game.

---

# 🧠 Hindi Memory Game

A third game (route **`/memory`**): a concentration game matching **picture**
cards with **letter** cards.

- Tap a card → it flips and its sound plays: a picture plays the **word**
  ("batakh"), a letter plays the **letter** ("ba").
- **Match** (a picture + its letter) → flash green, a **"bing!"**, the pair
  disappears. **No match** → flash red, both flip back.
- A **moves bar** across the top (coloured like the fish timer, but counting
  moves not time) gives `cols × rows` moves (= 2× the pairs — generous). Clear
  the board in time → **reward video** (see below) + next level. Run out →
  **"wa wa wa"** and you retry the same level.
- 4 levels of growing grids, each a different background colour:
  3×2 (6 cards) → 4×2 → 4×3 → 4×4 (16 cards, all 8 letters). The final screen
  links back to PadhaiPal on WhatsApp.

### 🎬 Reward video
When a level is **won**, instead of applause we play a short clip for the **last
matched letter** (e.g. a duck forming ब) — to make the picture↔letter link more
memorable. Clips live in `public/videos/<letterId>.mp4` and the available ids are
listed in `lib/letterVideos.ts` (all 8 letters). A letter with **no** clip would
fall back to the applause sound, so nothing breaks. The child can tap the video
or **आगे** to continue.

## 🛠️ Where to edit / audio

| What | File |
| --- | --- |
| Level grids + background colours | `lib/memory/levels.ts` |
| Game screen / card | `components/memory/MemoryGame.tsx`, `components/memory/Card.tsx` |
| Which letters have a reward video | `lib/letterVideos.ts` |

- `public/audio/pictures/<id>.mp3` — the picture **word** for each letter,
  auto-trimmed from the fish game's picture+letter recordings (the trailing
  letter removed). Letter taps reuse `public/audio/letters/<id>.mp3`.
- The match **"bing"** has no file yet, so a short synthesized chime plays
  (`playBingSound` in `lib/audio.ts`); drop in `public/audio/bing.mp3` to use a
  real one.

---

# 🚂 Hindi Word Train Game

A fourth game (route **`/wordtrain`**) for **blending letters into a whole word,
in the right order**.

A picture (+ spoken word) appears at the top; the written word is **not** shown.
A train **track** displays one shadow "coach" per letter (so the child sees how
long the word is), and the eight letter **coaches** sit at the bottom (one per
letter — an unlimited supply). The child **drags** a coach onto the track **or
just taps it** — either way it lands in the next slot:

- ✅ Correct next letter → the coach **clicks into place** beside the engine and
  says its sound.
- ❌ Wrong letter → it **drops back** to the bottom and the slot shakes red.
- When the last coach is placed, the **train chugs off** and the word is **blended
  aloud**. Tapping the picture replays the spoken word.

A session **ramps by word length** — two 2-letter, two 3-letter, then two
4-letter words (see `buildSession` in `lib/wordtrain/words.ts`) — and finishing
links back to PadhaiPal on WhatsApp. The first word gently pulses the correct
next coach as a demo.

## 🛠️ Where to edit / audio

| What | File |
| --- | --- |
| Word list (2-letter reuse Blocks; 3- & 4-letter) + session ramp | `lib/wordtrain/words.ts` |
| Game screen / drag-and-drop / train | `components/wordtrain/WordTrainGame.tsx` |
| Coach colours, track + rail, coach sizes | `app/globals.css` (Word Train section) |

- Spoken words live at `public/audio/words/<id>.mp3` — the 2-letter words reuse
  the Blocks recordings; the 3-letter (बरस, पलक, सबक, रबर) and 4-letter (कसरत,
  सरकस) words have their own. Letter "clicks" reuse the shared
  `public/audio/letters/<id>.mp3` sounds. Missing files fall back to a
  synthesized tone, as in the other games.
- To add more words, drop a spoken-word mp3 in `public/audio/words` and add an
  entry to `lib/wordtrain/words.ts` — the game already handles any word length.

---

# 🐸 Hindi Pond Hop Game

A fifth game (route **`/pondhop`**) for **recognising one target letter
repeatedly** while following a path across a river.

The far bank (top) shows the **target picture**. Stones are **scattered** across
the water; the **reachable** ones (the next hop) are highlighted with a yellow
ring. A frog crosses by hopping only on the stones showing the **target letter**:

- ✅ Correct stone → the frog **hops** to it along an arc, its letter sound
  plays, and the stone turns **green**. Reaching the far bank wins the level.
- ❌ Wrong stone → it flashes **red**, the frog **falls in with a splash**, and
  the level **restarts**.
- A **timer bar** (as in the fish game) must not run out, or the level restarts.
- Tapping the far-bank picture replays the prompt.

Five levels use **more & smaller stones** — 8 stones / 3 hops, then 12 / 4,
16 / 5, 20 / 6, 24 / 7 — each level a different water tint and a different
target letter (random order per game). Applause plays at the end of each level;
the final screen links back to PadhaiPal on WhatsApp.

## 🛠️ Where to edit

| What | File |
| --- | --- |
| Stones / targets / time / size per level | `lib/pondhop/levels.ts` |
| Row layout + distractor letters | `lib/pondhop/board.ts` |
| Game screen / frog / stones | `components/pondhop/PondHopGame.tsx` |

- Letter sounds reuse `public/audio/letters/<id>.mp3`; the intro prompt reuses
  the picture+letter recording (`public/audio/letters-word/<id>.mp3`), as in the
  fish game.

---

# ✍️ Hindi Lekhan (Writing) Game

A sixth game (route **`/lekhan`**) for **writing** the letters, then 2-letter
words, by finger on a slate.

A picture (and, on some levels, the letter/word) shows at the top and its sound
plays. The child draws on a chalkboard **slate**; each level finishes after 5
items, with applause, then the next level. The order is randomised.

- **L1** — the letter shows at the top and is traced on the slate **one stroke
  at a time, in order**. The accurate font glyph is split into its natural pen
  strokes (`lib/lekhan/strokes.ts`); every glyph pixel is coloured by its stroke:
  **red = the current stroke, light grey = upcoming, green = completed**. The
  current stroke also shows a step number + direction arrow. Straying outside it
  flashes red and wipes the attempt; covering it advances to the next — so the
  child learns the correct stroke order and direction.
- **L2** — the letter still shows at the top, but the slate is **blank** (write it).
- **L3** — only the **picture** shows (the sound plays); recall & write the letter.
- **L4** — **word mode**: a picture + its 2-letter word on a rectangular slate.
- **L5** — word mode with only the **picture**; recall & write the word.

### How the writing is checked
No hand-authored letter paths are needed: the target text is rendered to an
offscreen canvas (using the font) to get a reference **ink mask** on a coarse
grid. When the child lifts their finger:

- if too much of what they drew is **off** the glyph → the slate flashes **red**,
  wipes, and they start again (the "traced more than X px away" rule);
- once enough of the glyph is **covered** → it flashes **green** and completes.

The same reference works for the dotted-trace level and the blank / from-memory
levels alike (the reference is simply hidden). Thresholds live at the top of
`components/lekhan/Slate.tsx` (`OFF_MAX`, `COVER`, `GRID`) and are easy to tune.

**Word levels (L4/L5)** go further: instead of only checking the trace, they
**recognise which word was written** and accept it only if it's the target.
Recognition is two-tier (`lib/lekhan/recognize.ts`):

1. **Online first** — the raw ink strokes are sent to Google's Input Tools
   handwriting API (`inputtools.google.com`), which returns Devanagari
   candidates; we accept if the target is among the top matches. This handles
   any handwriting, not just our 12 words.
2. **On-device fallback** — if that call fails for any reason (offline, blocked,
   CORS, timeout), we fall back to a local closed-vocabulary recogniser: each of
   the 12 words is rendered to a canvas and reduced to a small, bounding-box
   -normalised, blurred ink-density feature, and the nearest word wins.

Either way, writing a different or garbled word genuinely fails, and the game
never breaks — the worst case is the fully-offline fallback.

## 🛠️ Where to edit

| What | File |
| --- | --- |
| Level modes / slate shape / item count / colours | `lib/lekhan/levels.ts` |
| Trace level (L1): stroke-order guide + per-stroke check | `components/lekhan/GuidedSlate.tsx` |
| The ordered pen strokes for each letter | `lib/lekhan/strokes.ts` |
| Slate (L2–L5): drawing + validation | `components/lekhan/Slate.tsx` |
| Game screen / prompt / sequence | `components/lekhan/LekhanGame.tsx` |

- The prompt sound reuses the picture+letter recording
  (`public/audio/letters-word/<id>.mp3`) for letters and the word recording
  (`public/audio/words/<id>.mp3`) for words.
