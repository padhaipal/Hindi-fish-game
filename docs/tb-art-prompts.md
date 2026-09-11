# टीबी का सफ़र — image prompts

The game currently draws every scene as a line drawing. If you add a photograph
named after the scene picture, that scene uses the photograph instead — no code
change:

```
public/images/tb/cough.jpg      ← used by the "two weeks of coughing" scene
public/images/tb/labTest.jpg    ← used by all four testing scenes
```

`.jpg` is tried first, then `.png`, then it falls back to the line drawing. So
you can add them one at a time and the game keeps working throughout.

**Shape:** 4:3 landscape, at least 1024 × 768. The picture is displayed inside a
rounded box and scaled to fit, so keep the subject centred with a little room
around it. Keep each file under ~250 KB (these are for cheap phones on slow
connections) — export JPEG at quality 75–80.

---

## Before you generate anything

**Make a character sheet first.** The same family appears across many pictures,
and nothing breaks the story faster than a different-looking household in every
scene. Generate one image of the five people (patient, wife, son, daughter,
mother), then attach it as a reference to every later prompt and say "same
people as the reference image".

**Say this in every prompt** (paste it at the end — it's the house style):

> Photorealistic documentary photograph, North India, small-town or peri-urban
> setting. Natural available light, plain uncluttered background, respectful and
> undramatic. Ordinary working-class Indian people in everyday clothes. No text,
> no signage, no logos, no brand names anywhere in the image. No medical gore.
> Muted, warm colour. Shot at eye level, 35 mm, shallow depth of field. 4:3.

**Two warnings.**

1. **No text in the image.** Image models write garbled Devanagari, and a player
   who cannot read will be confused by letter-shaped noise. If a prompt needs a
   sign or a report, ask for it blurred or out of frame.
2. **Stigma.** These pictures will be seen by people who have TB. Nothing should
   make a person with TB look frightening, dirty, or shameful — that is the exact
   belief the game is trying to undo. Show people, not patients: clothed, at
   home, doing ordinary things. For `coughBlood` and `gone` in particular, I'd
   keep the line drawing rather than photograph them; both are listed below if
   you disagree, but they are the two most likely to do harm.

---

## The pictures the game uses now

Five of these are done and in the repo (marked ✅). Photographs should be about
1024px on the long edge, progressive JPEG at quality ~78 — 50–130 KB each. The
game is for cheap phones on slow connections, so please keep new ones in that
range; I can resize anything that comes out larger.

| File | Where it is used |
| --- | --- |
| ✅ `cough.jpg` | the opening scene — two weeks of coughing |
| ✅ `coughBlood.jpg` | a month later, blood in the sputum |
| ✅ `weak.jpg` | too weak to work — the last chance scene |
| ✅ `clinic.jpg` | the government hospital (2 scenes) |
| ✅ `labTest.jpg` | the sputum test and its report (4 scenes) |
| `badNews.jpg` | the report is positive |
| `pillsDaily.jpg` | taking the daily medicine (2 scenes) |
| `smallHome.jpg` | the one-room house, and the "TB spread" ending |
| `family.jpg` | telling the family, and the "someone at home caught it" ending |
| `familyTest.jpg` | taking the household for screening |
| `food.jpg` | eating to get strong |
| `money.jpg` | no work, no money |
| `travel.jpg` | leaving for work in another city |
| `neighbours.jpg` | the neighbours talking (3 scenes) |
| `calendar.jpg` | six months nearly done |
| `strong.jpg` | recovered — and the winning ending |
| `gone.jpg` | the death ending |

### Prompts

**cough** — A man in his thirties in a plain shirt sits on a charpoy outside a
modest brick house, turning his head aside to cough into his shoulder, one hand
on his chest. Tired, not distressed. Early morning light.

**coughBlood** — A man sits on the edge of a charpoy looking down at a folded
cloth in his hands with quiet worry, shoulders hunched, thinner than before.
Keep the cloth plain and clean — no blood visible.

**weak** — A thin man sits slumped against a doorframe of a small house, too
tired to stand, one arm resting on a raised knee. His work tools lie unused
beside him. Soft afternoon light.

**clinic** — The entrance of a small Indian government health centre: plain
painted concrete building, a few people waiting on a bench outside in the shade,
a health worker in a plain coat walking in. No signboards or lettering.

**labTest** — Close-up on a pair of hands holding a small screw-top plastic
sample container on a clean laboratory bench, a diagnostic testing machine out of
focus behind. Clinical, calm, well lit.

**badNews** — A doctor in a plain white coat sits across a simple desk from a man,
leaning slightly forward, explaining something with an open and reassuring
expression while the man listens. A blank sheet of paper on the desk between
them. Serious but hopeful, not devastating.

**pillsDaily** — Close-up of a man's hands holding a strip of tablets and a steel
tumbler of water at a home doorway in morning light. Everyday, matter-of-fact.

**smallHome** — Interior of a single-room home: bedding rolled against one wall,
a few steel utensils, one small window with sunlight coming through. A family of
four sitting together on the floor. Modest, clean, lived-in.

**family** — A family of four or five standing together outside their home,
facing the camera, calm and dignified. This is the household the player is
protecting — make them look like people you would want to protect.

**familyTest** — A health worker sitting with a mother and two children outside a
small health centre, writing on a plain clipboard while the children wait.
Friendly and routine, not frightening.

**food** — A simple, generous home meal laid out on a steel thali: dal, roti,
vegetables, a boiled egg, a banana. Overhead shot on a plain surface. Warm and
appetising. Ordinary affordable food, not a restaurant spread.

**money** — A woman's hands counting out a few small banknotes and coins on a
worn cloth at home, with an empty steel container beside them. Anxious, quiet.
Indian currency but no readable numbers or text.

**travel** — A man with a cloth bundle over his shoulder boarding a crowded
long-distance bus at a small-town stand, early morning. Seen from behind, so he
stays anonymous.

**neighbours** — Three or four neighbours standing talking in a narrow lane,
glancing towards something off-frame. Everyday gossip, not menace.

**calendar** — A man's hands closing an almost-empty strip of medicine on a
windowsill, strong daylight. A quiet sense of nearly finished.

**strong** — The same man, visibly recovered: standing upright outside his house
in clean clothes, healthy weight, half-smiling, back at work or about to be. Warm
late-afternoon light. This is the reward picture — it should feel good.

**gone** — *(I would keep the line drawing here.)* A small oil lamp burning in a
darkened doorway at dusk. No people. Nothing else in frame.

## Pictures not used yet

These exist in the code and would be used if you add scenes for them:
`chemist` (a small medicine shop counter), `quack` (an untrained practitioner's
one-room "clinic" with a syringe on the table), `privateClinic` (a private
hospital reception, plainly more expensive), `goodNews` (a doctor handing over a
clear report, both smiling), `work` (a daily-wage labourer carrying bricks), and
`resting` (an empty charpoy in a quiet room).

---

## After you add them

Look at every scene on a phone. A photograph carries far more detail than the
line drawing did, and two things go wrong easily: the picture shrinks to nothing
on a short screen, or it pulls attention away from the choices underneath. If a
picture is fighting the buttons, the picture is wrong for that scene — the
choices are the game.
