#!/usr/bin/env python3
"""
Batch-OCR the timestamp burned into a folder of photos and compile to Excel.

Typical camera/phone timestamps sit in one corner of the frame. OCR is far more
reliable when you crop to *just* that corner first, so this script:

  1. Crops each image to a configurable region (default: bottom-right corner).
  2. Cleans it up (grayscale -> upscale -> threshold) for better OCR.
  3. Runs Tesseract restricted to timestamp characters.
  4. Writes one row per photo to an .xlsx file.

Because every camera burns the timestamp in a different spot, CALIBRATE FIRST
on a couple of images (see --preview below) before running the whole batch.

--------------------------------------------------------------------------
Setup (once):
    # Tesseract OCR engine
    #   macOS:         brew install tesseract
    #   Ubuntu/Debian: sudo apt install tesseract-ocr
    #   Windows:       https://github.com/UB-Mannheim/tesseract/wiki
    pip install pillow pytesseract openpyxl

Calibrate the crop box on ONE image, save the crop so you can eyeball it:
    python ocr_timestamps.py --preview /path/to/photos/IMG_0001.jpg

    # Not catching the timestamp? Adjust the region (fractions of the image,
    # left/top/right/bottom). These defaults grab the bottom-right ~35%x12%:
    python ocr_timestamps.py --preview IMG_0001.jpg --region 0.65 0.88 1.0 1.0

Run the whole folder once the crop looks right:
    python ocr_timestamps.py /path/to/photos --region 0.65 0.88 1.0 1.0 -o timestamps.xlsx
--------------------------------------------------------------------------
"""

import argparse
import os
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
    import pytesseract
    from openpyxl import Workbook
except ImportError as e:
    sys.exit(
        f"Missing dependency: {e.name}\n"
        "Install with:  pip install pillow pytesseract openpyxl\n"
        "and make sure the Tesseract engine itself is installed (see header)."
    )

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp", ".heic"}

# Characters a date/time stamp can contain. Restricting the alphabet greatly
# reduces OCR misreads (e.g. reading a stray letter into the date).
TS_WHITELIST = "0123456789:/.-APMapm "

# Loose pattern to flag rows that don't look like a timestamp, so you can
# quickly filter/fix them in Excel. Not used to reject anything.
LOOKS_LIKE_TS = re.compile(r"\d{1,4}[:/.\- ]\d")


def crop_region(img, region):
    """region = (left, top, right, bottom) as fractions 0..1 of the image."""
    w, h = img.size
    l, t, r, b = region
    box = (int(l * w), int(t * h), int(r * w), int(b * h))
    return img.crop(box)


def preprocess(crop, upscale=3):
    """Grayscale, upscale, and binarize to make small burnt-in text OCR-able."""
    g = ImageOps.grayscale(crop)
    g = ImageOps.autocontrast(g)
    if upscale > 1:
        g = g.resize((g.width * upscale, g.height * upscale), Image.LANCZOS)
    # Simple threshold. Timestamps are usually white or bright-orange on a
    # darker background; autocontrast + this threshold handles both reasonably.
    bw = g.point(lambda p: 255 if p > 140 else 0)
    return bw


def ocr_timestamp(bw):
    cfg = f'--psm 7 -c tessedit_char_whitelist={TS_WHITELIST}'
    text = pytesseract.image_to_string(bw, config=cfg)
    return " ".join(text.split()).strip()


def iter_images(folder):
    for p in sorted(Path(folder).iterdir()):
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
            yield p


def run_preview(image_path, region, upscale):
    img = Image.open(image_path)
    crop = crop_region(img, region)
    bw = preprocess(crop, upscale)
    stem = Path(image_path).stem
    crop_path = f"{stem}_crop.png"
    bw_path = f"{stem}_crop_processed.png"
    crop.save(crop_path)
    bw.save(bw_path)
    ts = ocr_timestamp(bw)
    print(f"Saved crop      -> {crop_path}")
    print(f"Saved processed -> {bw_path}   (this is what Tesseract sees)")
    print(f"OCR result      -> {ts!r}")
    print("\nOpen the *_processed.png. If the timestamp isn't tightly framed,")
    print("re-run --preview with a different --region until it is.")


def run_batch(folder, region, upscale, out_path):
    wb = Workbook()
    ws = wb.active
    ws.title = "Timestamps"
    ws.append(["filename", "timestamp", "looks_valid", "notes"])

    images = list(iter_images(folder))
    if not images:
        sys.exit(f"No images found in {folder}")

    total = len(images)
    n_ok = 0
    for i, p in enumerate(images, 1):
        note = ""
        ts = ""
        try:
            img = Image.open(p)
            crop = crop_region(img, region)
            bw = preprocess(crop, upscale)
            ts = ocr_timestamp(bw)
        except Exception as ex:  # keep going; record the failure in the sheet
            note = f"ERROR: {ex}"

        valid = bool(LOOKS_LIKE_TS.search(ts))
        if valid:
            n_ok += 1
        ws.append([p.name, ts, "yes" if valid else "no", note])
        print(f"[{i}/{total}] {p.name}: {ts!r}{'  <-- check' if not valid else ''}")

    wb.save(out_path)
    print(f"\nDone. {n_ok}/{total} rows look like valid timestamps.")
    print(f"Wrote {out_path}. Sort by 'looks_valid' = no to fix the stragglers by hand.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("path", help="Folder of photos (batch mode) or a single image (with --preview)")
    ap.add_argument("--preview", action="store_true",
                    help="Calibration mode: crop + OCR ONE image and save the crop to inspect.")
    ap.add_argument("--region", nargs=4, type=float, metavar=("L", "T", "R", "B"),
                    default=[0.60, 0.86, 1.0, 1.0],
                    help="Crop box as fractions 0..1: left top right bottom. "
                         "Default grabs the bottom-right corner.")
    ap.add_argument("--upscale", type=int, default=3, help="Upscale factor before OCR (default 3).")
    ap.add_argument("-o", "--output", default="timestamps.xlsx", help="Output .xlsx path.")
    args = ap.parse_args()

    if args.preview:
        run_batch_target = args.path
        if os.path.isdir(run_batch_target):
            sys.exit("--preview expects a single image path, not a folder.")
        run_preview(args.path, args.region, args.upscale)
    else:
        if not os.path.isdir(args.path):
            sys.exit(f"{args.path} is not a folder. Use --preview for a single image.")
        run_batch(args.path, args.region, args.upscale, args.output)


if __name__ == "__main__":
    main()
