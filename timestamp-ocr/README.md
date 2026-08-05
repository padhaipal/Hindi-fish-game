# Photo timestamp → Excel

Extracts the **capture time** from a folder of WhatsApp photos into an `.xlsx`.

## Capture time vs. received time — read this

A WhatsApp photo has two different times, and they aren't always the same:

- **Capture time** — when the photo was actually taken. The only reliable record
  is the timestamp **burned into the image** (the visible overlay in a corner).
  WhatsApp strips the camera's EXIF metadata, so this is *not* in the file's
  metadata — only in the printed pixels.
- **Received time** — when the photo arrived in the chat. This is what the
  **filename** encodes (`WhatsApp Image 2026-08-04 at 15.48.39.jpeg`). It equals
  the capture time only if the photo was sent promptly after being taken.

Tested on 12 real sample photos:
- The burned-in stamp comes in **4 different styles across 3 corners**. OCR
  (RapidOCR) reads it on **10 of 12** — only genuinely blank or blown-out
  stamps fail, and those fall back to the filename time.
- EXIF capture time was **stripped on all 12** (so metadata is no help).
- Where the stamp *was* readable, the filename ran **0–3 minutes after** it —
  i.e. these were taken and sent right away, so the filename is a good stand-in.

So the script reports **both** and lets you verify:

| source | meaning |
|---|---|
| `stamp` | capture time, read by OCR from the burned-in overlay (trust this) |
| `filename` | received time, used when OCR couldn't read the stamp |

`gap_min` = capture − received (when both exist). **If the gaps are all small
across your set, the photos were sent promptly and the filename time is a safe
stand-in for capture time on the rows OCR couldn't read.** Large gaps mean those
photos were sent late — trust the stamp for those.

## Install

No separate program to install — everything comes from pip:

```bash
pip install -r requirements.txt
```

(The OCR engine, RapidOCR, ships its models inside the pip package and runs on
the CPU. No Tesseract, no system binary.)

## Run

Recommended — pass the WhatsApp **chat export** so photos without a readable
stamp still get a time, and every photo gets its **teacher** (sender) name:

```bash
python ocr_timestamps.py "June" --chat "WhatsApp Chat with Teachers Team.txt" -o June_timestamps.xlsx
```

(To get the chat export: open the WhatsApp group → ⋯ → More → Export chat →
Without media. It saves a `.txt`.)

OCR takes roughly **2 seconds per photo** (~20 min for 600). For an instant pass
that skips OCR and uses the chat/filename time only:

```bash
python ocr_timestamps.py "June" --chat "chat.txt" --no-ocr -o June_timestamps.xlsx
```

## How the time is chosen (per photo, best available)

1. **Capture stamp** (OCR of the burned-in overlay) — the true "when taken".
2. **Chat time** (from `--chat`) — when it was posted; also gives the teacher.
3. **Filename date** — bulk-download names (`IMG-20260602-WA0006.jpg`) carry only
   the date, used as a last resort.

## Output columns

| column | meaning |
|---|---|
| `teacher` | sender of the photo, from the chat export |
| `best_estimate` / `date` / `time` | the value to use |
| `source` | `stamp` / `chat` / `filename` / `filename_date` / `none` |
| `capture_time_stamp` | OCR of the burned-in stamp (blank if unreadable) |
| `chat_time` | time the photo was posted, from the chat export |
| `gap_min` | capture − chat, in minutes (blank unless both exist) |
| `stamp_raw` | the raw text OCR matched, for spot-checking |
| `review` | `yes` when no exact time was found, or stamp vs chat disagree by >10 min |

Sort by `review = yes` to hand-check the few uncertain rows; scan `gap_min` to
confirm photos were posted promptly after being taken.
