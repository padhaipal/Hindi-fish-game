# Lifteracy chatbot demo

A browser copy of the **Lifteracy WhatsApp reading chatbot**, for giving demos.
It looks and behaves like a WhatsApp chat, but runs entirely in the browser.
There is no backend, no API key, and nothing is saved.

A separate app in this repo (like `alfa-english/` and `single-play/`), deployed
as its own Vercel project with **Root Directory = `lifteracy-demo`**.

## The flow

1. Buttons: **English (preview)** or **हिंदी**. Lifteracy currently teaches Hindi;
   the English version is labelled as a preview throughout.
2. A text message introduces Lifteracy, says it's a demo, and suggests reading
   at least one letter wrong to see the learning loop.
3. The bot sends the word (**cat** / **कल**) as an image, plus a voice note asking the user to read it.
4. The user replies with a voice message (tap 🎤, wait for "Speak now", speak, tap ➤). They can also type.
   - **Read correctly** → 👍 sticker.
   - **Read wrong** → the bot shows the letter they got wrong: *"What is this letter?"*
     - Right → back to the word.
     - Wrong → a **picture** that starts with the same sound (car / apple / top;
       कबूतर / लट्टू): *"What is this?"* Then a **picture → letter card** and
       *"What is the first sound?"*, then back to the word.

The bot works out which letter was wrong from what it heard: "cap" → **t**,
"cut" → **a**, "bat" → **c**; "कम" → **ल**, "जल" → **क**. It judges the last
real word of an answer, so "the letter is bar" counts as "bar".

A **commentary panel** explains each step for the audience: beside the phone on
a wide screen, along the bottom on a phone (tap its header to hide it).

## Speech

- **Speech to text:** the browser's built-in Web Speech API, which works best in
  **Chrome** (desktop and Android) and Edge. The demo shows what it heard under
  each voice message. After tapping the mic, wait for **"Speak now"**: anything
  said before the mic is live is lost.
- **Single sounds** (/b/, /t/) are the weak spot: browser recognition is built for
  words and often returns nothing for a lone consonant. When the mic heard a sound
  but no words came back, the bot says so and offers **✅ / ❌** buttons. The same
  buttons appear whenever nothing was recognised, so the demo never gets stuck.
- **The bot's voice** is the device's text-to-speech (en-IN / hi-IN).

### Swapping in real recordings

Every bot voice note first tries a recording at
`public/audio/voice/<en|hi>/<key>.mp3`, and falls back to text-to-speech when the
file is missing. Record each as one whole sentence:

| key | English | Hindi |
|-----|---------|-------|
| `read-word` | Can you read this word? Tap the microphone, and send me a voice message. | क्या तुम यह शब्द पढ़ सकते हो? माइक दबाओ, और मुझे अपनी आवाज़ में भेजो। |
| `read-again` | Now read the word again. | अब यह शब्द फिर से पढ़ो। |
| `what-letter` | Let's look at this letter. What is this letter? | इस अक्षर को देखो। यह कौन सा अक्षर है? |
| `letter-right` | Yes! That's right. | हाँ! बिल्कुल सही। |
| `what-picture` | Look at this picture. What is this? | यह चित्र देखो। यह क्या है? |
| `well-done` | Brilliant! You read it perfectly. | वाह! तुमने बिल्कुल सही पढ़ा। |
| `picture-right-<l>` | Yes, a top! | हाँ, लट्टू! |
| `picture-wrong-<l>` | This is a top. Can you say top? | यह लट्टू है। बोलो, लट्टू। |
| `picture-wrong-again-<l>` | This is a top. | यह लट्टू है। |
| `first-sound-<l>` | What is the first sound in top? | लट्टू की पहली आवाज़ क्या है? |
| `first-sound-right-<l>` | Well done! Top starts with the letter t. | शाबाश! लट्टू की पहली आवाज़ है ल। यह अक्षर है ल। |
| `first-sound-wrong-<l>` | Listen. Top starts with the letter t. | सुनो। लट्टू की पहली आवाज़ है ल। यह अक्षर है ल। |

`<l>` is the letter: `c`, `a`, `t` (English) or `ka`, `la` (Hindi). For example
`public/audio/voice/hi/first-sound-la.mp3`. All the wording lives in `lib/script.ts`.

## Running locally

```bash
cd lifteracy-demo
npm install
npm run dev
```

The microphone needs `localhost` or HTTPS.
