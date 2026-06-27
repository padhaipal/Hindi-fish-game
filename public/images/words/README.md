# Word pictures

One picture per letter, shown next to the target letter at the top of the
screen. The picture illustrates a familiar Hindi word that **starts** with that
letter (see `word` in `lib/letters.ts`). Name each file by the letter `id`:

| File | Letter | Word | Picture |
| --- | --- | --- | --- |
| `ba.png` | ब | बत्तख़ | duck |
| `sa.png` | स | साबुन | soap |
| `pa.png` | प | पतंग | kite |
| `ra.png` | र | रस्सी | rope |
| `ta.png` | त | तरबूज़ | watermelon |
| `ka.png` | क | कबूतर | pigeon |
| `cha.png` | च | चम्मच | spoon |
| `la.png` | ल | लट्टू | spinning top |

**Until a real file is dropped in, the game shows a matching emoji instead**, so
the picture slot is never empty (see the `emoji` field in `lib/letters.ts` and
the `WordPicture` fallback in `components/PondGame.tsx`).

Use square-ish images on a transparent or white background, kept small
(e.g. 256×256 PNG) for fast loading on low-end phones.
