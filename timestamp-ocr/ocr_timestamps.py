#!/usr/bin/env python3
r"""
Batch-extract the CAPTURE time from a folder of photos into an Excel file.

READ THIS FIRST -- what "timestamp" means here
----------------------------------------------
There are two different times attached to a WhatsApp photo, and they are NOT
always the same:

  * CAPTURE time  -- when the photo was actually taken. The only reliable record
                     is the timestamp *burned into the image* (the visible
                     overlay in a corner). WhatsApp strips the camera's EXIF
                     metadata, so the capture time is NOT in the file's
                     metadata -- only in those printed pixels.

  * RECEIVED time -- when the photo arrived in the chat. This is what the
                     WhatsApp FILENAME encodes, e.g.
                     "WhatsApp Image 2026-08-04 at 15.48.39.jpeg".
                     It equals the capture time ONLY if the photo was sent
                     promptly after being taken.

This script reports both, so you can trust the result:

  1. It OCRs the burned-in stamp -> capture_time (the one you actually want).
     Uses RapidOCR, which reads these overlays on ~10 of 12 typical photos
     (only genuinely blank / blown-out stamps fail).
  2. It parses the filename       -> received_time (available on every photo).
  3. best_estimate = capture_time when the stamp was read, else received_time.
  4. gap_min = capture_time - received_time (when both exist). If this is small
     across your set, photos were sent promptly and received_time is a safe
     stand-in for capture_time on the few rows OCR couldn't read.

Rows are flagged `review = yes` when the two times disagree by more than
--disagree-min minutes, or when neither source produced a time.

--------------------------------------------------------------------------
Setup (once) -- NO separate program to install, just pip:
    pip install rapidocr-onnxruntime openpyxl pillow numpy

Run:
    python ocr_timestamps.py /path/to/photos -o timestamps.xlsx

    # Filename time only, skip OCR (instant; received-time, not capture-time):
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
    from PIL import Image
    from openpyxl import Workbook
except ImportError as e:
    sys.exit(f"Missing dependency: {e.name}\n"
             "Install with:  pip install pillow openpyxl")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp", ".heic"}

MONTHS = {m.lower(): i for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], 1)}

# WhatsApp filename: "WhatsApp Image 2026-08-04 at 15.48.39.jpeg"
FNAME_RE = re.compile(r'(\d{4})-(\d{2})-(\d{2})\s+at\s+(\d{2})\.(\d{2})\.(\d{2})')

# OCR often runs words together, so these are space-TOLERANT:
#   "4Aug2026,1:01pm"  /  "4 August 2026 at 4:02 pm"
RE_TEXT = re.compile(
    r'(\d{1,2})\s*([A-Za-z]{3,9})\.?\s*(\d{4})\s*(?:,|at)?\s*(\d{1,2}):(\d{2})\s*([ap])', re.I)
#   "2026.08.0403:25P" / "2026080411:43" / "2026.08.04 05:01"
#   (Y M D; the day may glue to the time; meridian may be truncated or absent)
RE_YMD = re.compile(
    r'(\d{4})[.\-/ ]?(\d{2})[.\-/ ]?(\d{2})\s*(\d{1,2}):(\d{2})(?:\s*([ap]))?', re.I)


def parse_filename(name):
    m = FNAME_RE.search(name)
    if not m:
        return None
    y, mo, d, h, mi, s = map(int, m.groups())
    try:
        return datetime.datetime(y, mo, d, h, mi, s)
    except ValueError:
        return None


def _build(y, mo, d, h, mi, ap, received):
    y, mo, d, h, mi = int(y), int(mo), int(d), int(h), int(mi)
    if ap:
        ap = ap.lower()
        if ap == 'p' and h != 12:
            h += 12
        if ap == 'a' and h == 12:
            h = 0
        return datetime.datetime(y, mo, d, h, mi)
    # Meridian missing/truncated: choose the AM vs PM reading closest to the
    # received time (capture is always within a few minutes of it).
    opts = [datetime.datetime(y, mo, d, hh % 24, mi) for hh in {h, (h + 12) % 24}]
    if received:
        return min(opts, key=lambda dt: abs((dt - received).total_seconds()))
    return datetime.datetime(y, mo, d, h % 24, mi)


def parse_stamp(text, received):
    """Return (datetime, matched_str) from OCR text, or (None, '')."""
    t = " ".join(text.split())
    m = RE_TEXT.search(t)
    if m:
        d, mon, y, h, mi, ap = m.groups()
        mo = MONTHS.get(mon.lower()[:3])
        if mo:
            try:
                return _build(y, mo, d, h, mi, ap, received), m.group(0)
            except ValueError:
                pass
    m = RE_YMD.search(t)
    if m:
        y, mo, d, h, mi, ap = m.groups()
        try:
            return _build(y, mo, d, h, mi, ap, received), m.group(0)
        except ValueError:
            pass
    return None, ""


# --- OCR engine (RapidOCR) ----------------------------------------------------

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        import logging
        logging.getLogger().setLevel(logging.ERROR)  # quiet RapidOCR's chatter
        from rapidocr_onnxruntime import RapidOCR
        _engine = RapidOCR()
    return _engine


def ocr_stamp(img, received):
    """OCR the bottom strip and extract a timestamp. Returns (dt, raw_text)."""
    import numpy as np
    engine = get_engine()
    w, h = img.size
    crop = img.crop((0, int(h * 0.82), w, h)).convert("RGB")  # bottom 18%, full width
    result, _ = engine(np.array(crop))
    if not result:
        return None, ""
    text = " ".join(line[1] for line in result)
    dt, matched = parse_stamp(text, received)
    return dt, (matched or "")


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

    if use_ocr:
        try:
            get_engine()  # fail early with a clear message if RapidOCR is missing
        except ImportError:
            sys.exit("RapidOCR is not installed.\n"
                     "Install it with:  pip install rapidocr-onnxruntime numpy\n"
                     "Or run with --no-ocr to use filename (received) time only.")

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
                capture, raw = ocr_stamp(img, received)
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
    run(args.folder, args.output, use_ocr=not args.no_ocr, disagree_min=args.disagree_min)


if __name__ == "__main__":
    main()
