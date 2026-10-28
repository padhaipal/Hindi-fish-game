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
  the word. The child taps the mic and reads; speech-to-text marks the answer,
  so the phone needs internet.
- **खेल (Games)**: this repo's games, copied into `src/games` unchanged apart
  from their way out, and opened full screen. For now: the fish game (`/fish`).
- **प्रगति (Progress)**: the child's level, the words they finished, and their
  score for each letter.
- **सेटिंग (Settings)**: which speech-to-text engines are on, and a mic test.

## Same engine as the bot

`src/engine/` holds pp-sketch's lesson machine and answer marking, copied
unchanged (see `src/engine/README.md`). The parts of pp-sketch that use a
database are rewritten for the phone in `src/lesson/`:

- word choice and level: `selectNextString`
- scoring: `gradeAndRecord`, with the same +1.01 / −3.001 and the −10 floor
- the starting seed scores

Speech-to-text uses the engines production runs (Sarvam `saaras:v4`, Azure
fast transcription, Bodhan `indic-transcribe`), with the same settings, via
the STT server below. Their transcripts are joined the way pp-sketch joins
them.

## STT keys (on the server, not the phones)

The phones send each recording to a small relay, the **LIFTeracy STT
server** (`server/api/stt.ts`). It runs every engine that has a key and
returns all their transcripts. The keys live only in that server's Vercel
environment variables, so every phone works with no setup.

Vercel project `lifteracy-stt` (Root Directory `lifteracy-app/server`) ➜
Settings ➜ Environment Variables:

| variable | value |
|----------|-------|
| `SARVAM_API_KEY` | same as pp-sketch |
| `AZURE_SPEECH_KEY`, `AZURE_SPEECH_ENDPOINT` | same as pp-sketch |
| `BODHAN_API_KEY` | same as pp-sketch |
| `APP_ACCESS_CODE` | optional. When set, anyone without the code can't use the server (and your STT credit). Put the same code in the GitHub repository variable `LIFTERACY_STT_ACCESS_CODE`, so the APK has it built in |

Set any of the engine keys and redeploy. The app's **सेटिंग** screen shows
which engines are on, and has a mic test.

The app calls `https://lifteracy-stt.vercel.app` by default. If the server
gets a different address, set the repository variable `LIFTERACY_STT_URL`
(GitHub ➜ Settings ➜ Secrets and variables ➜ Actions ➜ Variables) and the
next APK uses it. It can also be changed per phone under सेटिंग ➜ सर्वर.

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

Every push that changes `lifteracy-app/` builds the app and publishes it as
the latest release. On the phone, open this link in the browser:

**https://github.com/padhaipal/Hindi-fish-game/releases/latest/download/lifteracy.apk**

When it has downloaded, tap it and allow "install unknown apps" for the
browser if Android asks. To update, download and install it again; the
students' data is kept.

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

The mic needs `localhost` or HTTPS in a browser. To point a dev build at a
different STT server, set `VITE_STT_SERVER_URL` in `lifteracy-app/.env.local`.
