# Analytics (PostHog) — main Hindi games site

The main site (`padhai-pal-hindi-fish-game`) sends a few **anonymous** events to
PostHog so you can see how each game, **letter** and **matra** is used. There are
no accounts or names — each device gets a random id. If the PostHog key isn't
set, analytics is completely off. (The `single-play/` build has its own copy —
see `single-play/ANALYTICS.md`.)

## Setup (once)

In the **`padhai-pal-hindi-fish-game`** Vercel project → **Settings →
Environment Variables**, add the same two values the `padhaipal_single_play`
project already uses (Production and Preview):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | your `phc_…` project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` or `https://us.i.posthog.com` |

Then redeploy. Using the same key sends both sites to one PostHog project; tell
them apart with PostHog's built-in **`$host`** property (e.g. filter
`$host = padhai-pal-hindi-fish-game.vercel.app`).

## The events

| Event | When | Properties |
|---|---|---|
| `game_open` | a game / letter / matra page is opened (incl. via the "next letter" button) | `game`, `letter` or `matra` |
| `game_time` | heartbeat — every 10s of active play (paused while the tab is hidden) | `game`, `letter`/`matra`, `seconds` (always 10) |
| `step_reached` | each step of a letter/matra journey begins | `game`, `letter`/`matra`, `step` (e.g. `fish`, `trace`), `step_number` (1-based), `total_steps` |
| `adventure_complete` | the child finishes every step of a letter/matra journey | `game`, `letter`/`matra`, `total_steps` |

`game` is `letter`, `matra`, or a standalone game: `fish`, `blocks`, `memory`,
`wordtrain`, `pondhop`, `lekhan`, `tb`. `letter` is the URL id (`/letter/ka` →
`ka`), `matra` likewise (`/matra/aa` → `aa`).

## Dashboard recipes (Product analytics → New insight)

- **Opens per letter:** Trends · `game_open` · Total count · filter `game = letter`
  · breakdown `letter`. (Same with `matra` for matras; breakdown `game` for the
  standalone games.)
- **Play time per letter:** Trends · `game_time` · Property sum of `seconds` ·
  breakdown `letter` (÷60 for minutes).
- **Completions per letter:** Trends · `adventure_complete` · Unique users ·
  breakdown `letter`.
- **Drop-off within a journey:** Trends · `step_reached` · Unique users ·
  breakdown `step_number` · filter one `letter`. Or a **Funnel** of
  `step_reached` where `step_number` = 1, 2, … 6, then `adventure_complete`.
