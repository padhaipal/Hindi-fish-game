# LIFTeracy teacher app (Android)

LIFTeracy's reading lessons as an Android app for a **teacher's phone**. The
teacher picks which child is reading, and the app loads that child's letter
scores ("phoneme weightings") and word level. The child reads into the phone,
and the games are built into the app.

A separate app in this repo (like `lifteracy-demo/` and `alfa-english/`):
Vite + React + TypeScript, packaged for Android with
[Capacitor](https://capacitorjs.com).

**This first build is a dummy with a single word, अब ("ab").** It has
pictures and sounds for its letters अ and ब.

## What's in it

- **Students**: add children and switch between them from the top bar. Each child
  keeps their own letter scores, word level, recent words and lesson in
  progress. Everything is saved on the phone.
- **पाठ (Lesson)**: the same loop as the WhatsApp bot: word ➜ the misread letter
  ➜ a picture that starts with that sound ➜ the picture-letter card ➜ back to
  the word. The child taps the mic and reads. The teacher can always mark the
  answer with **✅ सही / ❌ गलत**. For a misread word, they tap the letter that
  was wrong. This works with no STT keys and no internet.
- **खेल (Games)**: games run inside the app on the child's weakest letters. For
  now there's one, *मछली तालाब*, a fish game based on `/fish`.
- **प्रगति (Progress)**: the child's level, the words they finished, and their
  score for each letter.
- **सेटिंग (Settings)**: the STT keys, and a mic test.

## Same engine as the bot

`src/engine/` holds pp-sketch's lesson machine and answer marking, copied
unchanged (see `src/engine/README.md`). The parts of pp-sketch that use a
database are rewritten for the phone in `src/lesson/`:

- word choice and level: `selectNextString`
- scoring: `gradeAndRecord`, with the same +1.01 / −3.001 and the −10 floor
- the starting seed scores

Speech-to-text calls the engines production runs (Sarvam `saaras:v4`, Azure
fast transcription, Bodhan `indic-transcribe`), with the same settings. Every
engine that has a key runs in parallel, and their transcripts are joined the
way pp-sketch joins them.

## STT keys

Open the app ➜ **सेटिंग** ➜ paste any of:

| field | where it's from |
|-------|-----------------|
| Sarvam API key | pp-sketch `SARVAM_API_KEY` |
| Azure Speech key + endpoint | `AZURE_SPEECH_KEY`, `AZURE_SPEECH_ENDPOINT` |
| Bodhan API key | `BODHAN_API_KEY` |

Tap **सहेजें**, then **🎤 माइक से बोलकर जाँचें** to check they work. The keys
stay on that phone only and are never in the code or the APK. Anyone holding
the unlocked phone could still read them, so for a wide rollout use per-teacher
keys or a small proxy server.

## Media

Each lesson step's media is looked up by the machine's state-transition id,
the same way the bot does (`src/media/manifest.ts`). Per-letter pictures and
recordings are in `src/media/letters.ts`, with the files in `public/media/`:

- **ब**: real recordings copied from this repo's games (`public/audio/letters`,
  `letters-word`, `pictures`, `public/videos/ba.mp4`).
- **अ**: no recordings yet, so the phone's Hindi text-to-speech says them.
  Add `letter-a.mp3` etc. and list them in `letters.ts`.
- Pictures (बतख, अनार) are SVG drawings in `src/media/Picture.tsx`.
- Spoken instructions ("क्या तुम यह शब्द पढ़ सकते हो?") use text-to-speech for now.

To add words, put them in `src/lesson/words.ts` and give each new letter an
entry in `letters.ts`. `npm test` checks that every lesson step has media.

## Getting the APK

Every push that changes `lifteracy-app/` runs the **LIFTeracy Android APK**
GitHub Action. Open the run and download `lifteracy-debug-apk` from
*Artifacts*. Unzip it, copy `app-debug.apk` to the phone, and install it
(allow "install unknown apps").

## Developing

```bash
cd lifteracy-app
npm install
npm run dev        # in a browser, at phone width
npm test
```

```bash
npm run android:sync   # build the web app and copy it into android/
npm run android:open   # open in Android Studio, run on a phone
```

The mic needs `localhost` or HTTPS in a browser. In a browser, the STT calls
may be blocked by CORS; in the app they go through Android's native HTTP.
