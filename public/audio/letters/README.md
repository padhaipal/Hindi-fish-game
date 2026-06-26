# Letter sounds

Put one short spoken-letter recording here for each Hindi letter, named by its
`id` from `lib/letters.ts`:

- `ba.mp3` → ब
- `sa.mp3` → स
- `pa.mp3` → प
- `ra.mp3` → र
- `ta.mp3` → त
- `ka.mp3` → क
- `cha.mp3` → च
- `la.mp3` → ल

These are **placeholder paths**. If a file is missing, the game does NOT crash —
it plays a short synthesized "ding" instead (see `lib/audio.ts`). Drop real
recordings in with the exact filenames above and they will be used automatically.

Keep files small (mono, ~1 second) for fast loading on low-end phones.
