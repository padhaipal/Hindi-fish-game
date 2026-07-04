# Images

- `shared/padhaipal.jpeg` — the PadhaiPal picture shown on the home page and on
  the fish game's final "all done" screen (above the **पाठ पर जाएं** button).

If `shared/padhaipal.jpeg` is missing, the final screen shows a simple branded badge
instead (see `PadhaipalImage` in `components/fish/PondGame.tsx`), so nothing breaks.
Use a square-ish image; it's capped at ~220px wide.
