# ALfA English Games

Mobile-first English **phonics mini-games** for young learners (Grades 1–5), based on the
[ALfA English Reading & Writing](https://dignityeducation.org) book and its method:
*learn the **sound** through a **picture** the child already knows, not the letter name.*

A companion to the Hindi PadhaiPal games, built as a **separate, fully public** app
(no link expiry, no login).

## The games

| Game | What it does | Lessons |
|------|--------------|---------|
| 🐟 **Fish Game** | Hear a picture-word, catch the fish with its first letter | 1 · 3 · 5 · 7 · 9 |
| 🐸 **Frog Jump** | Hop the frog across the river on the right letter | 1 · 3 · 5 · 7 · 9 |
| ✏️ **Writing** | Trace each letter the right way (stroke by stroke) | 2 · 4 · 6 · 8 · 10 |
| 🧠 **Memory** | Match a picture with its letter | — |
| 🚂 **Word Train** | Drag letter-coaches to spell the pictured word | — |
| 🧱 **Blocks** | Tap the blocks in order to spell the word | — |
| 🪄 **Magic-e** | See how a silent *e* turns `cap` into `cape` | — |

### Lesson → letters (from the book)

| Lesson | Letters | Pictures |
|--------|---------|----------|
| 1 (read) / 2 (write) | a b t g c m | apple, bus, top, goat, car, mug |
| 3 (read) / 4 (write) | j e y s v | jam, egg, yo-yo, sun, van |
| 5 (read) / 6 (write) | k i d z p w | kite, insect, dog, zebra, pot, watch |
| 7 (read) / 8 (write) | l o f r x | lion, orange, fan, rabbit, box |
| 9 (read) / 10 (write) | h u n q | hat, umbrella, nest, queen |

## Shareable links

Every lesson has its own deep link, so a chatbot can send a child straight into one lesson:

```
/                 → the games menu
/fish             → Fish lesson picker
/fish/lesson-1    → Fish, Lesson 1 (a b t g c m)   /fish/lesson-3 · 5 · 7 · 9
/pond/lesson-1    → Frog Jump, Lesson 1            /pond/lesson-3 · 5 · 7 · 9
/writing/lesson-2 → Writing, Lesson 2             /writing/lesson-4 · 6 · 8 · 10
/memory  /train  /blocks  /magic-e
```

## Audio

All speech is the **browser's own text-to-speech** (Web Speech API) — no recorded audio
files. An Indian-English voice (`en-IN`) is preferred, then British, then any English
voice. Because TTS speaks whole *words* cleanly but not isolated phonemes, the games always
speak real words (“apple”, “cat”), never a bare “/a/”. Feedback blips (correct / wrong /
win) are tiny WebAudio tones generated on the fly.

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (fully static)
npm start
```

## Deploy

Point a Vercel project at this repo (or this folder). It's a standard Next.js 15 app with
no environment variables and no backend — deploy as-is for a public URL.
