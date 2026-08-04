#!/usr/bin/env python3
"""
Batch-extract the capture timestamp from a folder of photos into an Excel file.

WHY THIS ISN'T PURE OCR
-----------------------
Testing on a real sample of these photos showed the burned-in timestamp is NOT
uniform: four different overlay styles appear in three different corners, and
some photos have no readable stamp at all (overexposed or missing). Pure OCR
only recovered about half of them.

However, WhatsApp photos carry the capture time IN THE FILENAME, e.g.
    "WhatsApp Image 2026-08-04 at 15.48.39.jpeg"
and that time matched the burned-in stamp to within ~1-2 minutes on every photo
that had a readable stamp -- including the ones OCR couldn't read.

So this script picks the best timestamp per photo from these sources, in order:
    1. WhatsApp filename         (reliable, exact, present on all WhatsApp photos)
    2. EXIF DateTimeOriginal     (for non-WhatsApp files that kept metadata)
    3. OCR of the burned-in stamp (four formats, all corners)
    4. File modification time    (last resort)

It ALSO runs the OCR regardless, and writes it in its own column with the
minutes-difference vs the chosen time, so you can eyeball any disagreements.
Rows with no timestamp at all, or where OCR and filename disagree by a lot,
are flagged `needs_review = yes`.

--------------------------------------------------------------------------
Setup (once):
    # Tesseract OCR engine (only needed for the OCR cross-check column):
    #   macOS:  brew install tesseract
    #   Ubuntu: sudo apt install tesseract-ocr
    #   Windows: https://github.com/UB-Mannheim/tesseract/wiki
    pip install pillow pytesseract openpyxl

Run:
    python ocr_timestamps.py /path/to/photos -o timestamps.xlsx

    # Skip OCR entirely (much faster; filename/EXIF are enough for most):
    python ocr_timestamps.py /path/to/photos --no-ocr -o timestamps.xlsx
--------------------------------------------------------------------------
"""

import argparse
import os
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
    from PIL.ExifTags import TAGS
    from openpyxl import Workbook
except ImportError as e:
    sys.exit(f"Missing dependency: {e.name}\n"
             "Install with:  pip install pillow openpyxl  (and pytesseract for OCR)")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp", ".heic"}

# --- timestamp parsing helpers -------------------------------------------------

MONTHS = {m.lower(): i for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], 1)}

# WhatsApp filename: "WhatsApp Image 2026-08-04 at 15.48.39.jpeg"
FNAME_RE = re.compile(r'(\d{4})-(\d{2})-(\d{2})\s+at\s+(\d{2})\.(\d{2})\.(\d{2})')

# Burned-in overlay formats (seen in the sample):
#   A/D: "4 Aug 2026, 3:48 pm"  or  "4 August 2026 at 4:02 pm"
RE_TEXT = re.compile(
    r'(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\s*(?:,|at)?\s*(\d{1,2}):(\d{2})\s*([ap])\.?\s*m', re.I)
#   B: "2026.08.04 03:25 PM"  (Y M D with AM/PM; separators . - / or space)
RE_YMD_AMPM = re.compile(
    r'(\d{4})[.\-/ ](\d{1,2})[.\-/ ](\d{1,2})\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])\.?\s*m', re.I)
#   C: "2026 08 04 11:43"  (Y M D, 24-hour, no AM/PM)
RE_YMD_24 = re.compile(
    r'(\d{4})[.\-/ ](\d{1,2})[.\-/ ](\d{1,2})\s+(\d{1,2}):(\d{2})')


def _mk(y, mo, d, h, mi, s=0, ampm=None):
    h = int(h)
    if ampm:
        ampm = ampm.lower()
        if ampm == 'p' and h != 12:
            h += 12
        if ampm == 'a' and h == 12:
            h = 0
    return (int(y), int(mo), int(d), h, int(mi), int(s))


def parse_filename(name):
    m = FNAME_RE.search(name)
    if not m:
        return None
    y, mo, d, h, mi, s = m.groups()
    return _mk(y, mo, d, h, mi, s)


def parse_stamp(text):
    """Extract a timestamp tuple from OCR text; return (tuple, matched_str)."""
    t = " ".join(text.split())
    m = RE_TEXT.search(t)
    if m:
        d, mon, y, h, mi, ap = m.groups()
        mo = MONTHS.get(mon.lower()[:3])
        if mo:
            return _mk(y, mo, d, h, mi, ampm=ap), m.group(0)
    m = RE_YMD_AMPM.search(t)
    if m:
        y, mo, d, h, mi, ap = m.groups()
        return _mk(y, mo, d, h, mi, ampm=ap), m.group(0)
    m = RE_YMD_24.search(t)
    if m:
        y, mo, d, h, mi = m.groups()
        return _mk(y, mo, d, h, mi), m.group(0)
    return None, ""


def parse_exif(img):
    try:
        exif = img._getexif() or {}
    except Exception:
        return None
    tags = {TAGS.get(k, k): v for k, v in exif.items()}
    for key in ("DateTimeOriginal", "DateTimeDigitized", "DateTime"):
        v = tags.get(key)
        if v:
            m = re.match(r'(\d{4})[:\-/](\d{2})[:\-/](\d{2})[ T](\d{2}):(\d{2}):(\d{2})', str(v))
            if m:
                return _mk(*m.groups())
    return None


def fmt(tup):
    if not tup:
        return ""
    y, mo, d, h, mi, s = tup
    return f"{y:04d}-{mo:02d}-{d:02d} {h:02d}:{mi:02d}:{s:02d}"


def minutes_between(a, b):
    if not a or not b:
        return None
    # both are same date in practice; compute minute-of-day difference safely
    import datetime
    da = datetime.datetime(*a)
    db = datetime.datetime(*b)
    return round(abs((da - db).total_seconds()) / 60)


# --- OCR ----------------------------------------------------------------------

def ocr_stamp(img):
    """OCR bottom sub-regions (all corners) and return (tuple, matched_str)."""
    import pytesseract
    w, h = img.size
    regions = [
        (0, int(h * 0.86), int(w * 0.55), h),            # bottom-left  (Note 50S)
        (int(w * 0.25), int(h * 0.84), int(w * 0.80), h),  # bottom-center (realme/plain)
        (int(w * 0.55), int(h * 0.90), w, h),            # bottom-right (GPS/map)
        (0, int(h * 0.85), w, h),                        # full strip fallback
    ]
    for box in regions:
        crop = img.crop(box)
        g = ImageOps.autocontrast(ImageOps.grayscale(crop))
        g = g.resize((g.width * 3, g.height * 3), Image.LANCZOS)
        for psm in (7, 6, 11):
            raw = pytesseract.image_to_string(g, config=f'--psm {psm}')
            tup, matched = parse_stamp(raw)
            if tup:
                return tup, matched
    return None, ""


# --- main ---------------------------------------------------------------------

def iter_images(folder):
    for p in sorted(Path(folder).iterdir()):
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
            yield p


def file_mtime(path):
    import datetime
    dt = datetime.datetime.fromtimestamp(os.path.getmtime(path))
    return (dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second)


def run(folder, out_path, use_ocr, disagree_min):
    images = list(iter_images(folder))
    if not images:
        sys.exit(f"No images found in {folder}")

    wb = Workbook()
    ws = wb.active
    ws.title = "Timestamps"
    ws.append(["filename", "timestamp", "date", "time", "source",
               "ocr_stamp_raw", "ocr_timestamp", "ocr_vs_chosen_min", "needs_review"])

    total = len(images)
    counts = {"filename": 0, "exif": 0, "ocr": 0, "file_mtime": 0, "none": 0}
    review = 0

    for i, p in enumerate(images, 1):
        chosen = None
        source = "none"
        ocr_tup, ocr_raw = None, ""
        try:
            img = Image.open(p)
        except Exception as ex:
            ws.append([p.name, "", "", "", "error", f"open failed: {ex}", "", "", "yes"])
            counts["none"] += 1
            review += 1
            continue

        fn = parse_filename(p.name)
        ex = parse_exif(img) if fn is None else None  # cheap; only if needed
        if use_ocr:
            try:
                ocr_tup, ocr_raw = ocr_stamp(img)
            except Exception:
                ocr_tup, ocr_raw = None, ""

        # choose source in priority order
        if fn:
            chosen, source = fn, "filename"
        elif ex:
            chosen, source = ex, "exif"
        elif ocr_tup:
            chosen, source = ocr_tup, "ocr"
        else:
            chosen, source = file_mtime(p), "file_mtime"

        diff = minutes_between(chosen, ocr_tup) if ocr_tup else None
        needs = (source in ("none", "file_mtime")
                 or (diff is not None and diff > disagree_min))
        if needs:
            review += 1
        counts[source] = counts.get(source, 0) + 1

        y, mo, d, h, mi, s = chosen
        ws.append([
            p.name, fmt(chosen), f"{y:04d}-{mo:02d}-{d:02d}", f"{h:02d}:{mi:02d}:{s:02d}",
            source, ocr_raw, fmt(ocr_tup), diff if diff is not None else "",
            "yes" if needs else "",
        ])
        tail = "" if not needs else "   <-- review"
        print(f"[{i}/{total}] {p.name}: {fmt(chosen)} ({source}){tail}")

    wb.save(out_path)
    print(f"\nWrote {out_path}")
    print("Sources used:", ", ".join(f"{k}={v}" for k, v in counts.items() if v))
    print(f"Rows to review: {review}/{total}  (filter needs_review = yes in Excel)")


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder", help="Folder of photos.")
    ap.add_argument("-o", "--output", default="timestamps.xlsx", help="Output .xlsx path.")
    ap.add_argument("--no-ocr", action="store_true",
                    help="Skip the OCR cross-check (faster; filename/EXIF only).")
    ap.add_argument("--disagree-min", type=int, default=10,
                    help="Flag a row for review if OCR and chosen time differ by "
                         "more than this many minutes (default 10).")
    args = ap.parse_args()

    if not os.path.isdir(args.folder):
        sys.exit(f"{args.folder} is not a folder.")
    run(args.folder, args.output, use_ocr=not args.no_ocr, disagree_min=args.disagree_min)


if __name__ == "__main__":
    main()
