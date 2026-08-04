#!/usr/bin/env python3
"""
Batch-extract the CAPTURE time from a folder of photos into an Excel file.

READ THIS FIRST -- what "timestamp" means here
----------------------------------------------
There are two different times attached to a WhatsApp photo, and they are NOT
always the same:

  * CAPTURE time  -- when the photo was actually taken. The only reliable record
                     of this is the timestamp *burned into the image* (the
                     visible overlay in a corner). WhatsApp strips the camera's
                     EXIF metadata, so the capture time is NOT in the file's
                     metadata -- only in those printed pixels.

  * RECEIVED time -- when the photo arrived in the chat. This is what the
                     WhatsApp FILENAME encodes, e.g.
                     "WhatsApp Image 2026-08-04 at 15.48.39.jpeg".
                     It equals the capture time ONLY if the photo was sent
                     promptly after being taken.

This script reports both, so you can trust the result:

  1. It OCRs the burned-in stamp  -> capture_time (the one you actually want).
     Tesseract can read these on roughly half of typical photos; plain white
     stamps on busy backgrounds and over/under-exposed photos won't read.
  2. It parses the filename       -> received_time (available on every photo).
  3. best_estimate = capture_time when the stamp was read, else received_time.
  4. gap_min = capture_time - received_time (when both exist). If this is small
     across your whole set, the photos were sent promptly and received_time is a
     safe stand-in for capture_time on the photos OCR couldn't read. If you see
     large gaps, those photos were sent late -- trust capture_time / the stamp.

Rows are flagged `review = yes` when the two times disagree by more than
--disagree-min minutes, or when neither source produced a time.

--------------------------------------------------------------------------
Setup (once):
    # Tesseract OCR engine (required for the capture-time column):
    #   macOS:  brew install tesseract
    #   Ubuntu: sudo apt install tesseract-ocr
    #   Windows: install from https://github.com/UB-Mannheim/tesseract/wiki
    #            then, if needed, point to it at the top of your run, e.g.:
    #            set TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
    pip install pillow pytesseract openpyxl

Run:
    python ocr_timestamps.py /path/to/photos -o timestamps.xlsx

    # Filename time only, no OCR (instant, but received-time not capture-time):
    python ocr_timestamps.py /path/to/photos --no-ocr -o timestamps.xlsx
--------------------------------------------------------------------------
"""

import argparse
import datetime
import os
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps, ImageFilter
    from openpyxl import Workbook
except ImportError as e:
    sys.exit(f"Missing dependency: {e.name}\n"
             "Install with:  pip install pillow openpyxl  (and pytesseract for OCR)")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp", ".heic"}

MONTHS = {m.lower(): i for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], 1)}

# WhatsApp filename: "WhatsApp Image 2026-08-04 at 15.48.39.jpeg"
FNAME_RE = re.compile(r'(\d{4})-(\d{2})-(\d{2})\s+at\s+(\d{2})\.(\d{2})\.(\d{2})')

# Burned-in overlay formats seen in the sample photos:
#   "4 Aug 2026, 3:48 pm"  /  "4 August 2026 at 4:02 pm"
RE_TEXT = re.compile(
    r'(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\s*(?:,|at)?\s*(\d{1,2}):(\d{2})\s*([ap])\.?\s*m', re.I)
#   "2026.08.04 03:25 PM"  (Y M D + AM/PM; separators . - / or space)
RE_YMD_AMPM = re.compile(
    r'(\d{4})[.\-/ ](\d{1,2})[.\-/ ](\d{1,2})\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])\.?\s*m', re.I)
#   "2026 08 04 11:43"  (Y M D, 24-hour)
RE_YMD_24 = re.compile(
    r'(\d{4})[.\-/ ](\d{1,2})[.\-/ ](\d{1,2})\s+(\d{1,2}):(\d{2})')


def _dt(y, mo, d, h, mi, s=0, ampm=None):
    h = int(h)
    if ampm:
        ampm = ampm.lower()
        if ampm == 'p' and h != 12:
            h += 12
        if ampm == 'a' and h == 12:
            h = 0
    try:
        return datetime.datetime(int(y), int(mo), int(d), h, int(mi), int(s))
    except ValueError:
        return None


def parse_filename(name):
    m = FNAME_RE.search(name)
    if not m:
        return None
    return _dt(*m.groups())


def parse_stamp(text):
    """Return (datetime, matched_str) extracted from OCR text, or (None, '')."""
    t = " ".join(text.split())
    m = RE_TEXT.search(t)
    if m:
        d, mon, y, h, mi, ap = m.groups()
        mo = MONTHS.get(mon.lower()[:3])
        if mo:
            dt = _dt(y, mo, d, h, mi, ampm=ap)
            if dt:
                return dt, m.group(0)
    m = RE_YMD_AMPM.search(t)
    if m:
        y, mo, d, h, mi, ap = m.groups()
        dt = _dt(y, mo, d, h, mi, ampm=ap)
        if dt:
            return dt, m.group(0)
    m = RE_YMD_24.search(t)
    if m:
        y, mo, d, h, mi = m.groups()
        dt = _dt(y, mo, d, h, mi)
        if dt:
            return dt, m.group(0)
    return None, ""


def ocr_stamp(img):
    """OCR the bottom corners (all overlay positions) and return (dt, raw)."""
    import pytesseract
    w, h = img.size
    regions = [
        (0, int(h * 0.86), int(w * 0.55), h),              # bottom-left  (Note 50S)
        (int(w * 0.20), int(h * 0.83), int(w * 0.85), h),  # bottom-center (realme/plain)
        (int(w * 0.50), int(h * 0.90), w, h),              # bottom-right (GPS/map)
    ]
    for box in regions:
        crop = img.crop(box)
        g = ImageOps.autocontrast(ImageOps.grayscale(crop), cutoff=1)
        g = g.resize((g.width * 3, g.height * 3), Image.LANCZOS)
        g = g.filter(ImageFilter.SHARPEN)
        # a couple of binarizations catch light-on-dark and dark-on-light stamps
        for variant in (g,
                        g.point(lambda p: 255 if p > 150 else 0),
                        g.point(lambda p: 0 if p > 150 else 255)):
            for psm in (7, 11):
                dt, raw = parse_stamp(pytesseract.image_to_string(variant, config=f'--psm {psm}'))
                if dt:
                    return dt, raw
    return None, ""


def fmt(dt):
    return dt.strftime("%Y-%m-%d %H:%M:%S") if dt else ""


def iter_images(folder):
    for p in sorted(Path(folder).iterdir()):
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
            yield p


def run(folder, out_path, use_ocr, disagree_min):
    images = list(iter_images(folder))
    if not images:
        sys.exit(f"No images found in {folder}")

    wb = Workbook()
    ws = wb.active
    ws.title = "Timestamps"
    ws.append(["filename", "best_estimate", "date", "time", "source",
               "capture_time_stamp", "received_time_filename",
               "gap_min", "stamp_raw", "review"])

    total = len(images)
    n_stamp = n_file = n_none = n_review = 0

    for i, p in enumerate(images, 1):
        try:
            img = Image.open(p)
        except Exception as ex:
            ws.append([p.name, "", "", "", "error", "", "", "", f"open failed: {ex}", "yes"])
            n_none += 1
            n_review += 1
            print(f"[{i}/{total}] {p.name}: ERROR {ex}")
            continue

        received = parse_filename(p.name)
        capture, raw = (None, "")
        if use_ocr:
            try:
                capture, raw = ocr_stamp(img)
            except Exception:
                capture, raw = (None, "")

        if capture:
            best, source = capture, "stamp"
            n_stamp += 1
        elif received:
            best, source = received, "filename"
            n_file += 1
        else:
            best, source = None, "none"
            n_none += 1

        gap = None
        if capture and received:
            gap = round((capture - received).total_seconds() / 60)

        review = (source == "none") or (gap is not None and abs(gap) > disagree_min)
        if review:
            n_review += 1

        ws.append([
            p.name, fmt(best),
            best.strftime("%Y-%m-%d") if best else "",
            best.strftime("%H:%M:%S") if best else "",
            source, fmt(capture), fmt(received),
            gap if gap is not None else "", raw,
            "yes" if review else "",
        ])
        tag = "" if not review else "   <-- review"
        print(f"[{i}/{total}] {p.name}: {fmt(best)} ({source})"
              f"{'' if gap is None else f'  gap={gap:+d}m'}{tag}")

    wb.save(out_path)
    print(f"\nWrote {out_path}")
    print(f"Capture time from stamp (OCR): {n_stamp}/{total}")
    print(f"Fell back to filename time:    {n_file}/{total}")
    if n_none:
        print(f"No time found at all:          {n_none}/{total}")
    print(f"Rows flagged for review:       {n_review}/{total}  (filter review = yes)")
    if n_stamp:
        print("\nTip: check the gap_min column on the 'stamp' rows. If gaps are all\n"
              "small, photos were sent promptly and the filename time is a safe\n"
              "stand-in for capture time on the rows OCR couldn't read.")


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder", help="Folder of photos.")
    ap.add_argument("-o", "--output", default="timestamps.xlsx", help="Output .xlsx path.")
    ap.add_argument("--no-ocr", action="store_true",
                    help="Skip OCR; use filename (received) time only. Instant.")
    ap.add_argument("--disagree-min", type=int, default=10,
                    help="Flag review if stamp and filename differ by more than "
                         "this many minutes (default 10).")
    args = ap.parse_args()

    if not os.path.isdir(args.folder):
        sys.exit(f"{args.folder} is not a folder.")

    # Allow overriding the tesseract binary path (handy on Windows).
    env_cmd = os.environ.get("TESSERACT_CMD")
    if env_cmd and not args.no_ocr:
        import pytesseract
        pytesseract.pytesseract.tesseract_cmd = env_cmd

    run(args.folder, args.output, use_ocr=not args.no_ocr, disagree_min=args.disagree_min)


if __name__ == "__main__":
    main()
