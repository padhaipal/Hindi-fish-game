# PadhaiPal — single-play build

A separate copy of the PadhaiPal Hindi games for the **WhatsApp one-time-link**
use case. It differs from the main app in three ways:

1. **Full alphabet.** Every letter that has a picture (38 of them) is used
   equally at random by each game — see `lib/letters.ts`.
2. **No navigation.** There is no games hub and no home button, so a child sent
   a link to one game can't wander to the others.
3. **One-time links.** Each link opens its game exactly once.

The original app under the repo root is untouched (the root build simply
excludes this folder via `tsconfig.json`).

## Running locally

```bash
cd single-play
npm install        # or reuse the root install
npm run build && npm start
```

With no `LINK_SECRET` set the one-time gate is **off**, so every route is open —
convenient for development.

## One-time links

Turn the gate on by setting environment variables:

| Variable | Purpose |
|---|---|
| `LINK_SECRET` | **Required to enable the gate.** HMAC secret shared by the app and your bot. Any long random string. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | The shared "burn" store (Upstash Redis, free tier). **Required in production** — without it the app falls back to a per-instance in-memory store that is NOT reliable across serverless instances. |
| `MINT_SECRET` | Guards `/api/mint` so only your bot can create links. |
| `GATE_DISABLED=1` | Force the gate off even if `LINK_SECRET` is set. |

### How it works
- A link is `/<game>?t=<token>` where `token = <id>.<HMAC-SHA256(id, LINK_SECRET)>`.
- On first open the middleware verifies the signature, **burns the id** in the
  store (atomic `SET burn:<id> 1 NX`), sets a signed 15-minute session cookie
  (so an accidental reload still works), and strips the token from the URL.
- Any later open of the same link — or a missing/invalid token with no live
  session — is sent to `/used`.

### Minting links for the bot
```
GET /api/mint?key=<MINT_SECRET>&game=fish&n=5
  -> { "links": [ "https://<host>/fish?t=...", ... ] }
```
`game` is one of `fish blocks memory wordtrain pondhop lekhan`. If your bot can
compute HMAC-SHA256 itself, it can mint links without this endpoint:
`token = <uuid>.<base64url(HMAC_SHA256(uuid, LINK_SECRET))>`.

## Deploying
Deploy this folder as its own project (e.g. a Vercel project with **Root
Directory = `single-play`**), separate from the main app. Set the env vars
above in that project.

## Still to wire up
- **Audio.** Uses the synth fallback until real clips are added under
  `public/audio/letters/<id>.mp3`, `public/audio/letters-word/<id>.mp3` and
  `public/audio/words/<id>.mp3` (ids are the transliterations in `lib/letters.ts`
  / the word files).
- **Writing game (L1)** only has stroke-order data for the original 8 letters;
  other letters fall back to a plain guide line.
