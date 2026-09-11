# टीबी का सफ़र — the TB treatment game (`/tb`)

A decision-path game for **tb.care**. The player is a person in a poor North
Indian household who starts coughing. Every screen is a real choice; the choices
decide whether they finish the six months **alive, cured, and without giving TB
to anybody at home**. That triple is the win condition.

It is deliberately unlike the children's games in this repo: adult subject
matter, a calm paper-and-ink look, and a spoken line on every screen so that it
can be played by somebody who cannot read Hindi.

---

## How it is built

| File | What lives there |
| --- | --- |
| `lib/tb/types.ts` | The data model: scenes, options, effects, meters |
| `lib/tb/profile.ts` | The life situation dealt at the start (household, work, risk factors) |
| `lib/tb/engine.ts` | The rules: meters, how TB spreads at home, how the game ends |
| `lib/tb/scenes/diagnosis.ts` | Part 1 — the cough, the doctor, the test, the house |
| `lib/tb/scenes/treatment.ts` | Part 2 — the six months, and the drug-resistant road |
| `lib/tb/story.ts` | Puts the two halves together, looks scenes up by id |
| `lib/tb/speech.ts` | The voice: recorded Hindi if present, else the phone's Hindi TTS |
| `components/tb/Figures.tsx` | Scene pictures (`TbArt` — a photo if one exists, else the line drawing) and choice icons (`TbIcon`, from Lucide) |
| `lib/tb/uiLines.ts` | The spoken lines outside the story: opening, household, how-to-play, meters |
| `lib/tb/i18n.ts` | The two languages: which words to use, and the buttons around the game |
| `lib/tb/en.ts` | Every line of the game in English, keyed by the same ids |
| `components/tb/Meters.tsx` | Health thermometer, money, household figures, the six-month track |
| `components/tb/TbGame.tsx` | The game loop and screens |
| `app/tb/page.tsx` | The route (Hindi); `app/tb/hi` is the same page, `app/tb/en` is English |

**To add or change a scene**, edit one of the two files in `lib/tb/scenes/`.
Nothing else needs to change: a scene is a picture name, one spoken line, and
2–4 options, each with an effect, a result, the true fact it teaches, and the id
of the next scene. In development the story checks itself at load time and warns
in the console about any option pointing at a scene that does not exist.

---

## The voice (important, and not finished)

The game is meant to be playable **without reading**. Every line is spoken:

1. First it looks for a recording at `public/audio/tb/<id>.mp3`.
2. If there is none, the phone's own Hindi (`hi-IN`) text-to-speech reads the
   same line out loud.

**No recordings exist yet** — today every line is read by the phone's TTS, which
is understandable but flat, and on a phone with no Hindi voice installed it will
fall back to an Indian-English voice reading Devanagari, which is poor. Recording
a real Hindi voice is the single biggest improvement left.

**The full recording list is [docs/tb-audio-script.md](tb-audio-script.md)**
(and `tb-audio-script.csv` for a spreadsheet): 244 files, about 34 minutes of
finished audio. It is generated from the game itself —

```bash
npm run tb:audio      # rewrites both files from lib/tb
```

so after editing any scene, re-run it and the list stays in step. Ids follow the
scene and option ids:

| Recording | id |
| --- | --- |
| A scene's line | `<sceneId>.mp3` — e.g. `s_cough.mp3` |
| A choice | `<sceneId>_<optionId>.mp3` — e.g. `s_cough_clinic.mp3` |
| What happened after a choice | `<sceneId>_<optionId>_result.mp3` |
| The fact behind it | `<sceneId>_<optionId>_result_fact.mp3` |
| An ending, and its fact | `end_<endingId>.mp3`, `end_<endingId>_fact.mp3` |
| The opening line, household cards, meters | `intro.mp3`, `life_*.mp3`, `meter_*.mp3` — all in `lib/tb/uiLines.ts` |

Dropping the files into `public/audio/tb/` is all that is needed — the game
picks them up with no code change, one at a time, and anything not yet recorded
keeps using TTS.

**Every spoken line is a fixed sentence with no numbers spliced into it**, which
is why the meters say "आप कमज़ोर हो रहे हैं" rather than "सेहत 5 में से 10", and why
the household cards have ids like `life_home_ekKamra` rather than `life_home`.
Keep it that way when adding lines, or that line can never be recorded.

---

## Where the content comes from

The wording follows the **tb.care Simplified Hindi** document and the **tb.care
module list**, so that a player hears the same messages on the site and in the
game:

| tb.care module | Scenes |
| --- | --- |
| 1. TB can happen to anyone / recognising TB / see a doctor soon | `s_cough`, `s_ask`, `s_cough2`, `s_cough3` |
| 2. Free testing and treatment / collecting a good sputum sample / your test report | `s_sputum`, `s_sputum2`, `s_result` |
| 2. How to get free government TB medicines (DOTS, the three documents, Ni-kshay) | `s_docs` |
| 2. About your TB medicines / treatment lasts 6 months / checking treatment is working | `s_month1_side`, `s_month2_test`, `s_better`, `s_month6` |
| 2. Sometimes the usual TB medicines won't work (drug-resistant TB) | `s_relapse`, `s_mdr` |
| 2. The government gives money to TB patients / why hasn't my money come | `s_money` |
| 3. The TB medicines make me feel sick (the side-effect table) | `s_month1_side` |
| 3. My family member has TB / staying safe / how to avoid giving TB to others | `s_tell`, `s_home`, `s_stigma` |
| 3. Eat healthy food — grow strong — fight TB / myths about food | `s_food` |
| 3. Things to avoid (alcohol) | `s_habit` |
| 3. Getting help (helpline 1800-116666, ASHA, JSK) | `s_money`, `s_travel` |

Two additions that the written tb.care modules do not yet cover, both standard
NTEP practice and both important to the win condition:

* **`s_contacts` — household contact screening and preventive treatment (TPT).**
  The tb.care phone-counselling schedule lists contact screening as a topic, but
  there is no module text for it. Since "nobody else infected" is how the player
  wins, the game needed it.
* **`s_comorbid` — the HIV and blood-sugar tests offered to every TB patient.**

### Open questions for the tb.care team

1. **Ni-kshay Poshan Yojana amount.** The tb.care document says ₹500 per month;
   the scheme was raised to ₹1,000 per month in late 2024. The game deliberately
   avoids naming a figure ("पैसे खाते में आते हैं") so it cannot go stale — worth
   fixing in the tb.care text either way.
2. **How long until a patient stops being infectious.** tb.care says three to
   four weeks of medicine, so that is what the game says, in the scene and in the
   winning ending.
3. All Hindi in the game should get a read-through by a native North Indian
   speaker before recording — it was written to match the tb.care register
   (simple conversational Hindustani), but it has not been reviewed.

---

## The numbers

The meters are **game-balanced approximations**, not a clinical model. They are
tuned so that the choices a doctor would recommend are also the choices that win.
Where a number reflects a real statistic, it is because of the following:

* **Treatment success.** Around 85–90% of people who complete a full course of
  treatment for drug-sensitive TB are cured — hence "दस में से नौ" in the winning
  ending, and why a player who plays well always survives.
* **Untreated TB.** Roughly two-thirds of people with untreated smear-positive
  pulmonary TB die within ten years (Tiemersma et al., 2011) — the basis for the
  `died` and `spreading` endings.
* **Spread.** One untreated person with pulmonary TB infects on the order of
  10–15 people a year (WHO) — quoted in `s_cough3` and `s_neighbour`, and the
  reason exposure accumulates every scene the player stays untreated.
* **Crowding.** A one-room home multiplies each scene's exposure by 1.4
  (`homeFactor` in `engine.ts`).
* **Preventive treatment.** TPT cuts a contact's risk of developing TB by
  roughly 60–90%; the game uses 80% (`infectionChance` in `engine.ts`).
* **Undernutrition** is the largest single driver of TB in India, and nutritional
  support has been shown to cut deaths substantially among patients and TB
  incidence among household contacts (RATIONS trial, Jharkhand, 2023) — which is
  why `kamzori` is the most commonly dealt risk factor and why `s_food` moves the
  health meter more than any other single choice.
* **Comorbidities.** Diabetes roughly doubles-to-triples the risk of TB and
  worsens outcomes; tobacco and alcohol each raise risk and relapse; untreated
  HIV raises TB risk many times over. These set the player's starting health and
  their `danger` weight in `profile.ts`.
* **Catastrophic costs.** Around half of TB-affected households in India face
  catastrophic costs (WHO). In the game, private care and moneylenders empty the
  money meter, and an empty money meter costs health — that is how catastrophic
  costs kill.

Sources to check the figures against when the content is next revised: the **WHO
Global TB Report**, the **India TB Report (NTEP)**, and the RATIONS trial.

---

## Two languages

| URL | Language |
| --- | --- |
| `/tb` and `/tb/hi` | Hindi — the original |
| `/tb/en` | English — the same game, translated |

The game itself is written in Hindi: scenes, choices, results and facts all live
in `lib/tb/` as Hindi text. English is a translation layer keyed by the **same
ids the recordings use** — `s_cough_clinic_result_fact` names one line of the
game, and has a Hindi string, an English string and (one day) a recording in
each language.

Nothing about the story is duplicated, so the two languages cannot drift apart
structurally: add a scene and it exists in both at once, and only its words need
translating. A line with no English falls back to Hindi rather than showing a
blank, and `npm run tb:audio` lists every id that is still missing so this
cannot go unnoticed. It currently reports none.

**English recordings** go in `public/audio/tb/en/<id>.mp3`, alongside the Hindi
ones in `public/audio/tb/`. The phone's text-to-speech is asked for `en-IN`
rather than `hi-IN` when the English game is being played.

The opening screen of each carries a link to the other.

## Pictures

Scenes use a photograph when one exists at `public/images/tb/<art name>.jpg` (or
`.png`), and fall back to the line drawing when one does not. Sixteen are in,
covering every scene in the game **except `smallHome`** — the one-room house,
which is used by the household screen, the "protect your family" scene and the
"TB spread at home" ending, and still draws. Its prompt is in
**[docs/tb-art-prompts.md](tb-art-prompts.md)** along with the six pictures for
scenes that do not exist yet.

Photographs are resized to 1024px on the long edge and saved as progressive JPEG
at quality 78, which lands each one between 50 and 130 KB. Please keep new ones
in that range: this game is for cheap phones on slow connections.

Choice icons are [Lucide](https://lucide.dev) (`lucide-react`), with a small
badge layered over a few of them for the things Lucide has no icon for — a
stopped pill, a hospital that charges.

## Why the game always ends

`SCENE_ORDER` in `lib/tb/story.ts` lists every scene in the order the story runs,
and **every choice must lead to a scene further down that list**. That one rule
makes the story a one-way road: no sequence of choices can return to a scene
already played, so no run can loop and every run reaches an ending. The longest
possible game is 22 scenes.

It is a direction, not a schedule — a choice may skip far ahead (going private
jumps straight to the diagnosis), it just may never go back.

The subtle part is that **`s_cough3` ("too weak to work") sits after the sputum
scenes, not before them**. Delay in this game makes you sicker, and being sicker
has to move you forward into a worse situation rather than back into the one you
just refused. Until this order existed, refusing the sputum test sent you to
`s_cough3`, whose only way out was that same sputum scene — a loop a player
could ride for ever, and one that nothing stopped, because health could sit at
zero indefinitely.

`checkStory()` enforces it: `npm run tb:audio` exits non-zero and names the
offending choice, and the same check warns in the browser console in
development. Note that it is not wired into `next build` — run `npm run tb:audio`
after editing scenes.

Two things keep a run bounded even so:

* An empty health meter ends the game where it happens (`isDead` in
  `engine.ts`), which is what the how-to-play screen already promises.
* Endings are terminal — nothing leads out of them.

## The choices are shuffled

The order of the choices is randomised per scene and per game, so nobody learns
"the answer is the first one" instead of learning about TB. The shuffle is
seeded from the scene id and one number picked at the start of each game, which
matters for a reason that is easy to miss: the order must never change while the
player is looking at it, or they will tap a choice they did not mean to.

Because of this, tests cannot select a choice by position — each choice button
carries `data-option="<option id>"`, and `scripts`-level tests select by that.

## Reading along

Whatever the voice is saying is highlighted as it says it, so somebody who is
slowly working through the words can keep their place, and somebody who cannot
read at all can see the game working through the choices one at a time.
`lib/tb/speech.ts` publishes the id of the line being spoken
(`subscribeSpeaking`), and each screen lights up the element with that id.

One wrinkle worth keeping: a phone with no Hindi voice installed says nothing
and reports that it finished instantly. Rather than letting the highlight flash
past, `speakWithTts` notices an implausibly fast finish and paces the line by
estimated reading speed instead.

## Sound

Beyond the spoken lines, the game plays a short chime the moment a result
appears: `public/audio/tb/sfx-correct.wav` for a good choice, `sfx-wrong.wav`
for a bad one, and nothing for a "mixed" one, which was neither. At the end it
reuses the letter games' `clap.mp3` and `wa-wa-wa.mp3` through `lib/audio.ts`.

The two chimes are synthesised, not recorded — a rising two-note bell and a
soft low fall. The wrong-answer one is deliberately gentle: a wrong choice here
is a normal part of learning, and nothing in this game should frighten someone
who has TB. Replace either file to change the sound; keep the names.

Worth knowing while you are in here: **`public/audio/wrong-baap.mp3` in this
repo is a zero-byte file**, and `public/audio/bing.mp3` (used by the memory
game) does not exist at all. Both fall back to `lib/audio.ts`'s synthesised
tone, and the empty file makes the browser log a 416 error each time. That
affects the letter games, not this one — the TB game no longer references
either — but it is worth fixing.

## Fitting one phone screen

The playing screen never scrolls: the picture is the only flexible part, so it
shrinks and the choices stay put. Checked at 360×640, 390×844 and 412×915. If
you add a scene with five options or a very long line, re-check it at 360×640 —
that is the size that breaks first.

## What is still missing

* Real recorded Hindi audio (see above) — the biggest gap.
* A read-through of the Hindi by a native speaker.
* No progress is saved: closing the page starts a new life. That is deliberate
  for now (no login, no backend), but a "carry on where you left off" would help
  a player who is interrupted.
* The game is in this repo for testing. When it moves to its own home, everything
  it needs is `app/tb`, `components/tb`, `lib/tb`, the `/* टीबी का सफ़र */`
  section at the end of `app/globals.css`, and this document.
