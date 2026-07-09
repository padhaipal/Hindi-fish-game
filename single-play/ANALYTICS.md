# Analytics (PostHog)

The single-play build sends a few **anonymous** events to [PostHog](https://posthog.com)
so you can see how the games are used. There are no accounts and no names — each
device gets a random id. If the PostHog key isn't set, analytics is completely
off.

## Setup (once)

1. Create a free PostHog account (EU region recommended for children's data).
2. Copy your **Project API key** (starts with `phc_…`) from **Settings → Project**.
3. In the **`padhaipal_single_play`** Vercel project → **Settings → Environment
   Variables**, add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_POSTHOG_KEY` | your `phc_…` key |
   | `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com` (or `https://us.i.posthog.com`) |

4. Redeploy. Events start flowing on the next visit.

> The `phc_…` key is a **public** client key — it can only send events, not read
> your data — so it's safe to expose in the browser and store in Vercel.

## The events

| Event | When | Properties |
|---|---|---|
| `game_open` | a game link is opened (counts a **click**, incl. hitting the cooldown "come back" screen) | `game` |
| `game_time` | **heartbeat** — every 10s of active play (paused while the tab is hidden) | `game`, `seconds` (always 10) |
| `level_reached` | each level / word step begins | `game`, `level` (1-based) |

Total active play time for a game = **sum of `game_time.seconds`**. A single
play session ≈ the number of `game_time` events in that PostHog session × 10s.
We use a heartbeat (rather than one event at the end) because mobile browsers
fire the page-unload event unreliably, so an end-of-session total can't be
trusted.

`game` is always the base game with the link-pool suffix folded away
(`/blocks-7` → `blocks`). For Word Train, which has words rather than levels,
`level` is the word number — so the drop-off funnel is uniform across games.

## Building the dashboard (three insights)

In PostHog, create a new **Dashboard**, then add these insights (Product
analytics → New insight):

**(a) Clicks per game**
- Type **Trends**, series = event **`game_open`**, math **Total count**.
- **Break down by** → event property **`game`**.
- Shows how many times each game's links were opened.

**(b) Time spent playing**
- **Total active minutes per game:** Trends, series = event **`game_time`**, math
  **Property sum → `seconds`**, **Break down by `game`**. (Divide by 60 for
  minutes.)
- **Median play-session length (distribution):** easiest via a **SQL/HogQL**
  insight — sum the heartbeats per session, then look at the spread:
  ```sql
  SELECT properties.game AS game,
         count() * 10 AS play_seconds
  FROM events
  WHERE event = 'game_time'
  GROUP BY game, $session_id
  ```
  Then chart `play_seconds` (e.g. median / P90) by `game`. Each row is one play
  session, so it's the per-play distribution you asked for.

**(c) Level reached before drop-out**
- Type **Trends**, series = event **`level_reached`**, math **Unique users**.
- **Break down by** property **`level`**. Filter to one `game` at a time.
- The bars fall off as fewer players reach each successive level — that's the
  drop-off. (A **Funnel** with a step per level works too.)

Pin all three to the dashboard and you have the full picture in one view.
PostHog's built-in **"Analyze"** assistant can also build any of these from a
plain-English prompt (e.g. "count of game_open broken down by game").
