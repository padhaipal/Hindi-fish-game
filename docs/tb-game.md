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
| `components/tb/Figures.tsx` | Every line drawing (`TbArt` for scenes, `TbIcon` for choices) |
| `components/tb/Meters.tsx` | Health thermometer, money, household figures, the six-month track |
| `components/tb/TbGame.tsx` | The game loop and screens |
| `app/tb/page.tsx` | The route |

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
a real Hindi voice is the single biggest improvement left. The ids follow the
scene and option ids, so they can be recorded straight from a script:

| Recording | id |
| --- | --- |
| A scene's line | `<sceneId>.mp3` — e.g. `s_cough.mp3` |
| A choice | `<sceneId>_<optionId>.mp3` — e.g. `s_cough_clinic.mp3` |
| What happened after a choice | `<sceneId>_<optionId>_result.mp3` |
| The fact behind it | `<sceneId>_<optionId>_result_fact.mp3` |
| An ending, and its fact | `end_<endingId>.mp3`, `end_<endingId>_fact.mp3` |

Dropping the files into `public/audio/tb/` is all that is needed — the game
picks them up with no code change.

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

## What is still missing

* Real recorded Hindi audio (see above) — the biggest gap.
* A read-through of the Hindi by a native speaker.
* No progress is saved: closing the page starts a new life. That is deliberate
  for now (no login, no backend), but a "carry on where you left off" would help
  a player who is interrupted.
* The game is in this repo for testing. When it moves to its own home, everything
  it needs is `app/tb`, `components/tb`, `lib/tb`, the `/* टीबी का सफ़र */`
  section at the end of `app/globals.css`, and this document.
