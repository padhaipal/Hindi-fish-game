# Photo timestamp → Excel

Batch-crops each photo to the corner where the timestamp is burned in, OCRs it,
and writes one row per photo to an `.xlsx`.

## Install

```bash
# OCR engine (once):
#   macOS:  brew install tesseract
#   Ubuntu: sudo apt install tesseract-ocr
#   Windows: https://github.com/UB-Mannheim/tesseract/wiki
pip install -r requirements.txt
```

## Use it in two steps

**1. Calibrate the crop on one image** (do this first — every camera puts the
timestamp in a different place):

```bash
python ocr_timestamps.py --preview /path/to/photos/IMG_0001.jpg
```

Open the generated `IMG_0001_crop_processed.png` — that's exactly what the OCR
sees. If the timestamp isn't tightly framed, adjust `--region` (fractions of the
image: left top right bottom) and re-run until it is:

```bash
# e.g. timestamp is along the bottom strip:
python ocr_timestamps.py --preview IMG_0001.jpg --region 0.0 0.9 1.0 1.0
# e.g. top-right corner:
python ocr_timestamps.py --preview IMG_0001.jpg --region 0.6 0.0 1.0 0.1
```

**2. Run the whole folder** with the region that worked:

```bash
python ocr_timestamps.py /path/to/photos --region 0.60 0.86 1.0 1.0 -o timestamps.xlsx
```

## Output

`timestamps.xlsx` with columns:

| filename | timestamp | looks_valid | notes |
|----------|-----------|-------------|-------|

Sort by `looks_valid = no` to quickly find and hand-fix the few the OCR missed.
