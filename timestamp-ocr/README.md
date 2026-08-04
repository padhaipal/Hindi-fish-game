# Photo timestamp → Excel

Extracts the capture time from a folder of photos and writes one row per photo
to an `.xlsx`.

## Why it's not pure OCR

Testing on a real sample of these photos showed the burned-in timestamp is **not
uniform** — four different overlay styles appear in three different corners, and
some photos have no readable stamp at all (overexposed or missing). Pure OCR only
recovered about half of them.

But WhatsApp photos carry the capture time **in the filename**:

```
WhatsApp Image 2026-08-04 at 15.48.39.jpeg   ->   2026-08-04 15:48:39
```

and on every sample that had a readable burned-in stamp, the filename time
matched it to within ~1–3 minutes — including the photos OCR couldn't read.

So the script picks the best timestamp per photo, in priority order:

1. **WhatsApp filename** — reliable, exact, present on all WhatsApp photos
2. **EXIF DateTimeOriginal** — for non-WhatsApp files that kept their metadata
3. **OCR of the burned-in stamp** — handles all four overlay formats / corners
4. **File modification time** — last resort

It still runs OCR on every photo and writes the result in its own column with the
minutes-difference vs the chosen time, so you can spot-check. Any row with no real
timestamp, or where OCR and the filename disagree by more than 10 minutes, is
flagged `needs_review = yes`.

## Install

```bash
# OCR engine (only needed for the cross-check column):
#   macOS:  brew install tesseract
#   Ubuntu: sudo apt install tesseract-ocr
#   Windows: https://github.com/UB-Mannheim/tesseract/wiki
pip install -r requirements.txt
```

## Run

```bash
python ocr_timestamps.py /path/to/photos -o timestamps.xlsx

# Faster — skip OCR entirely (filename/EXIF are enough for WhatsApp photos):
python ocr_timestamps.py /path/to/photos --no-ocr -o timestamps.xlsx
```

## Output columns

| filename | timestamp | date | time | source | ocr_stamp_raw | ocr_timestamp | ocr_vs_chosen_min | needs_review |
|----------|-----------|------|------|--------|---------------|---------------|-------------------|--------------|

- **timestamp / date / time** — the value to use.
- **source** — where it came from (`filename`, `exif`, `ocr`, `file_mtime`).
- **ocr_\*** — independent OCR read, for cross-checking.
- **needs_review** — sort/filter by `yes` to hand-check the few uncertain rows.

## Verified on 12 sample photos

All 12 resolved from the filename; OCR agreed within 0–3 minutes on the 6 photos
with a clearly readable stamp; the other 6 (blurred/overexposed/no stamp) still
got the correct time from the filename. 0 rows needed review.
