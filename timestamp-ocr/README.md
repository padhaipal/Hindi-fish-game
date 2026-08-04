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
- The burned-in stamp comes in **4 different styles across 3 corners**, and OCR
  (Tesseract) can read it on about **half** — plain white stamps on busy
  backgrounds and over/under-exposed shots won't read.
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

```bash
# Tesseract OCR engine (required for the capture-time column):
#   macOS:  brew install tesseract
#   Ubuntu: sudo apt install tesseract-ocr
#   Windows: install from https://github.com/UB-Mannheim/tesseract/wiki
pip install -r requirements.txt
```

On Windows, if Python can't find Tesseract, point to it before running:

```bat
set TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

## Run

```bash
python ocr_timestamps.py /path/to/photos -o timestamps.xlsx
```

OCR takes roughly **2–3 seconds per photo** (~25 min for 600). For an instant
filename-only pass (received time, no capture stamp):

```bash
python ocr_timestamps.py /path/to/photos --no-ocr -o timestamps.xlsx
```

## Output columns

| column | meaning |
|---|---|
| `best_estimate` / `date` / `time` | the value to use (stamp if read, else filename) |
| `source` | `stamp` (capture) or `filename` (received) |
| `capture_time_stamp` | OCR of the burned-in stamp (blank if unreadable) |
| `received_time_filename` | time parsed from the WhatsApp filename |
| `gap_min` | capture − received, in minutes (blank if no stamp) |
| `stamp_raw` | the raw text OCR matched, for spot-checking |
| `review` | `yes` when the two times disagree by >10 min, or no time was found |

Sort by `review = yes` to hand-check the few uncertain rows; sort/scan `gap_min`
to confirm your photos were sent promptly.
