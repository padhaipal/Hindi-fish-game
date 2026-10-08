# Lifteracy chatbot demo

A browser copy of the **Lifteracy WhatsApp reading chatbot**, for giving demos.
It looks and behaves like a WhatsApp chat, but runs entirely in the browser.
There is no backend, no API key, and nothing is saved.

A separate app in this repo (like `alfa-english/` and `single-play/`), deployed
as its own Vercel project with **Root Directory = `lifteracy-demo`**.

## The flow

1. Buttons: **English** or **हिंदी**. The choice sets the language for the rest of the chat.
2. A text message introduces Lifteracy, says it's a demo, and suggests reading
   at least one letter wrong to see the learning loop.
3. The bot sends the word (**cat** / **कल**) as an image, plus a voice note asking the user to read it.
4. The user replies with a voice message (tap 🎤, speak, tap ➤). They can also type.
   - **Read correctly** → 👍 sticker.
   - **Read wrong** → the bot shows the letter they got wrong: *"What is this letter?"*
     - Right → back to the word.
     - Wrong → a **picture card** that starts with the same sound (car / apple / tiger;
       कबूतर / लट्टू): *"What is this?"*. When they name it: *"What is the first sound?"*
       Then back to the word.

The bot works out which letter was wrong from what it heard: "cap" → **t**,
"cut" → **a**, "bat" → **c**; "कम" → **ल**, "जल" → **क**.

## Speech

- **Speech to text:** the browser's built-in Web Speech API. It works best in
  **Chrome** (desktop and Android) and Edge. Under each voice message the demo
  shows what it heard, so the audience can see it working.
- **If it hears nothing**, or the browser has no speech recognition (Firefox, some
  iPhones), the bot shows **✅ I got it right / ❌ I got it wrong** buttons so the
  demo never gets stuck. Typing the answer also works.
- **The bot's voice** is the device's text-to-speech (en-IN / hi-IN), plus the
  recorded letter sounds and picture words already in this repo
  (`public/audio/sounds`, `public/audio/pictures`).

### Swapping in real recordings

Every bot voice note first tries a recording at
`public/audio/voice/<en|hi>/<key>.mp3`, and falls back to text-to-speech when the
file is missing. Drop files in with these names:

| key | English | Hindi |
|-----|---------|-------|
| `read-word` | Can you read this word? Tap the microphone, and send me a voice message. | क्या तुम यह शब्द पढ़ सकते हो? माइक दबाओ, और मुझे अपनी आवाज़ में भेजो। |
| `read-again` | Now read the word again. | अब यह शब्द फिर से पढ़ो। |
| `what-letter` | Let's look at this letter. What is this letter? | इस अक्षर को देखो। यह कौन सा अक्षर है? |
| `letter-right` | Yes! That's right. | हाँ! बिल्कुल सही। |
| `what-picture` | Here's a hint. What is this? | यह इशारा देखो। यह क्या है? |
| `well-done` | Brilliant! You read it perfectly. | वाह! तुमने बिल्कुल सही पढ़ा। |
| `picture-right-<l>` | Yes, a tiger! What is the first sound in tiger? | हाँ, लट्टू! लट्टू की पहली आवाज़ क्या है? |
| `picture-wrong-<l>` | This is a tiger. Can you say tiger? | यह लट्टू है। बोलो, लट्टू। |
| `picture-wrong-again-<l>` | This is a tiger. What is the first sound in tiger? | यह लट्टू है। लट्टू की पहली आवाज़ क्या है? |
| `first-sound-right-<l>` | Well done! Tiger starts with /t/. This letter says /t/. | शाबाश! लट्टू की पहली आवाज़ है /ल/। यह अक्षर है /ल/। |
| `first-sound-wrong-<l>` | Listen. Tiger starts with /t/. This letter says /t/. | सुनो। लट्टू की पहली आवाज़ है /ल/। यह अक्षर है /ल/। |

`<l>` is the letter: `c`, `a`, `t` (English) or `ka`, `la` (Hindi). For example
`public/audio/voice/en/picture-right-t.mp3`. All the wording lives in `lib/script.ts`.

## Running locally

```bash
cd lifteracy-demo
npm install
npm run dev
```

The microphone needs `localhost` or HTTPS.
