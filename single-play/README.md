# PadhaiPal — single-play build

A separate copy of the PadhaiPal Hindi games for the **WhatsApp reward-link**
use case. It differs from the main app in three ways:

1. **Full alphabet.** Every letter that has a picture is used equally at random
   by each game — see `lib/letters.ts`.
2. **No navigation.** There is no games hub and no home button, so a child sent
   a link to one game can't wander to the others.
3. **Per-device cooldown.** Each game link is reusable, but once opened on a
   device it's "used" there for a while (default 7 days), then works again.

The original app under the repo root is untouched (the root build simply
excludes this folder via `tsconfig.json`).

## Running locally

```bash
cd single-play
npm install        # or reuse the root install
npm run build && npm start
```

Set `GATE_DISABLED=1` in `.env.local` while developing so the cooldown doesn't
lock you out after one play.

## The play gate (how the links work)

Each game has a **pool of 10 interchangeable links** — the bare slug plus nine
numbered variants — so the bot can keep handing out the same game and still pick
a link that isn't on cooldown:

```
https://<your-domain>/blocks
https://<your-domain>/blocks-2
https://<your-domain>/blocks-3
…
https://<your-domain>/blocks-10
```

The same pattern applies to `fish`, `memory`, `wordtrain`, `pondhop` and
`lekhan` — **60 links total** (6 games × 10). Every variant opens the *same*
game (`/blocks-3` internally renders `/blocks`); the number only changes which
cookie is used.

- **Each link cools down independently.** Opening `/blocks-3` marks only
  `/blocks-3` as used on that device; `/blocks`, `/blocks-5`, etc. still play.
  So a random re-send from the bot almost always lands on a fresh link.
- The links never change and can be pasted once into the bot.
- The first time a child opens a given link on their device, a cookie marks
  that link "used"; re-opening the **same** link shows the "come back and do
  another lesson" screen until its cooldown passes.
- The cookie is read on the first request (it travels with it), so this works
  from the WhatsApp in-app browser with a single tap — no second click.
- It's deliberately light: no accounts, no server store, easily bypassed
  (clearing cookies / incognito). It just stops the same link being replayed
  between lessons.

A ready-to-paste list of all 60 links (with your domain filled in) can be
generated with `node scripts/print-links.mjs https://<your-domain>`.

### Config (env, all optional)
| Variable | Purpose |
|---|---|
| `COOLDOWN_HOURS` | How long a game stays "used" per device. Default `168` (7 days). |
| `GATE_DISABLED=1` | Turn the gate off entirely (e.g. local dev). |

There are **no secrets and no database** to set up.

## Deploying (Vercel)

Deploy this folder as its **own** Vercel project, separate from the main app:

1. **Add New → Project**, import this repo, set **Root Directory = `single-play`**
   (Framework: Next.js, auto-detected).
2. (Optional) set `COOLDOWN_HOURS` in Environment Variables.
3. **Deploy.** Then give your bot the 6 static links above.

> If you previously set `LINK_SECRET`, `MINT_SECRET`, `UPSTASH_REDIS_REST_URL`
> or `UPSTASH_REDIS_REST_TOKEN`, they're no longer used and can be deleted (the
> Upstash database can be removed too).

## Still to wire up
- **Writing game (L1)** stroke data covers all letters; picture emojis can still
  be tweaked in `lib/letters.ts` / `components/shared/*Icon`.
