#!/usr/bin/env python3
r"""
Batch-extract the CAPTURE time (and sender/teacher) for a folder of WhatsApp
photos into an Excel file.

WHERE EACH VALUE COMES FROM
---------------------------
A WhatsApp photo has several possible time sources; this script uses the most
reliable one available per photo, in this order:

  1. CAPTURE time  -- OCR of the timestamp burned into the image (the visible
                      overlay in a corner). This is the true "when it was taken"
                      and is preferred whenever it can be read.
  2. CHAT time     -- from a WhatsApp chat-export .txt (--chat). Each photo's
                      filename is matched to the message that posted it, giving
                      the time it was sent AND the sender's name (the teacher).
                      Used when the burned-in stamp can't be read.
  3. FILENAME date -- bulk-downloaded names like "IMG-20260602-WA0006.jpg" carry
                      only the date (no time). Used as a last resort.

The chat export also provides the TEACHER (sender) column for every photo it
can match, regardless of which time source was used.

Columns written:
  filename, teacher, best_estimate, date, time, source,
  capture_time_stamp, chat_time, gap_min, stamp_raw, review

  * source     = stamp / chat / filename / filename_date / none
  * gap_min    = capture_time - chat_time in minutes (when both exist); if small,
                 photos were sent promptly.
  * review=yes = no exact time was found, or stamp and chat disagree by a lot.

--------------------------------------------------------------------------
Setup (once) -- just pip, no separate program:
    pip install rapidocr-onnxruntime numpy pillow openpyxl

Run (recommended -- with the chat export for times + teacher names):
    python ocr_timestamps.py "June" --chat "WhatsApp Chat with Teachers Team.txt" -o June_timestamps.xlsx

    # Without OCR (instant; uses chat / filename only):
    python ocr_timestamps.py "June" --chat "chat.txt" --no-ocr -o June_timestamps.xlsx
--------------------------------------------------------------------------
"""

import argparse
import datetime
import os
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
    from openpyxl import Workbook
except ImportError as e:
    sys.exit(f"Missing dependency: {e.name}\n"
             "Install with:  pip install pillow openpyxl")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp", ".heic"}

MONTHS = {m.lower(): i for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], 1)}

# ---- filenames ---------------------------------------------------------------
# Old style with a full time: "WhatsApp Image 2026-08-04 at 15.48.39.jpeg"
FNAME_FULL = re.compile(r'(\d{4})-(\d{2})-(\d{2})\s+at\s+(\d{2})\.(\d{2})\.(\d{2})')
# Bulk-download style, date only: "IMG-20260602-WA0006.jpg"
FNAME_DATE = re.compile(r'(\d{4})(\d{2})(\d{2})')


def parse_filename(name):
    """Return (datetime, has_time). has_time is False when only a date is known."""
    m = FNAME_FULL.search(name)
    if m:
        y, mo, d, h, mi, s = map(int, m.groups())
        try:
            return datetime.datetime(y, mo, d, h, mi, s), True
        except ValueError:
            pass
    m = FNAME_DATE.search(name)
    if m:
        y, mo, d = map(int, m.groups())
        try:
            return datetime.datetime(y, mo, d), False
        except ValueError:
            pass
    return None, False


# ---- chat export -------------------------------------------------------------
# "02/06/2026, 09:11 - Mariyam: IMG-20260602-WA0006.jpg (file attached)"
# tolerant of 12-hour times ("9:11 am"), seconds, and en-dash separators.
CHAT_LINE = re.compile(
    r'(\d{1,2})/(\d{1,2})/(\d{2,4}),\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*([apAP][. ]?[mM])?\s*[-–]\s*'
    r'([^:]+?):\s*([A-Za-z0-9._-]+\.\w+)\s*\(file attached\)')


def parse_chat(path):
    """Map {filename: (datetime, sender)} from a WhatsApp chat export."""
    mapping = {}
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            g = CHAT_LINE.search(line)
            if not g:
                continue
            d, mo, y, h, mi, ap, sender, fname = g.groups()
            y = int(y)
            y = y + 2000 if y < 100 else y
            h = int(h)
            if ap:
                ap = ap.lower().replace(".", "").replace(" ", "")
                if ap == "pm" and h != 12:
                    h += 12
                if ap == "am" and h == 12:
                    h = 0
            try:
                dt = datetime.datetime(y, int(mo), int(d), h, int(mi))
            except ValueError:
                continue
            mapping.setdefault(fname, (dt, sender.strip()))  # first occurrence wins
    return mapping


# ---- burned-in stamp parsing -------------------------------------------------
# OCR often runs words together, so these are space-TOLERANT:
#   "4Aug2026,1:01pm" / "4 August 2026 at 4:02 pm"
RE_TEXT = re.compile(
    r'(\d{1,2})\s*([A-Za-z]{3,9})\.?\s*(\d{4})\s*(?:,|at)?\s*(\d{1,2}):(\d{2})\s*([ap])', re.I)
#   "2026.08.0403:25P" / "2026080411:43" / "2026.08.04 05:01"
RE_YMD = re.compile(
    r'(\d{4})[.\-/ ]?(\d{2})[.\-/ ]?(\d{2})\s*(\d{1,2}):(\d{2})(?:\s*([ap]))?', re.I)


def _build(y, mo, d, h, mi, ap, ref):
    y, mo, d, h, mi = int(y), int(mo), int(d), int(h), int(mi)
    if ap:
        ap = ap.lower()
        if ap == 'p' and h != 12:
            h += 12
        if ap == 'a' and h == 12:
            h = 0
        return datetime.datetime(y, mo, d, h, mi)
    # Meridian missing/truncated: pick the AM vs PM reading closest to a
    # reference time (the chat time), since capture is within minutes of it.
    opts = [datetime.datetime(y, mo, d, hh % 24, mi) for hh in {h, (h + 12) % 24}]
    if ref:
        return min(opts, key=lambda dt: abs((dt - ref).total_seconds()))
    return datetime.datetime(y, mo, d, h % 24, mi)


def parse_stamp(text, ref):
    t = " ".join(text.split())
    m = RE_TEXT.search(t)
    if m:
        d, mon, y, h, mi, ap = m.groups()
        mo = MONTHS.get(mon.lower()[:3])
        if mo:
            try:
                return _build(y, mo, d, h, mi, ap, ref), m.group(0)
            except ValueError:
                pass
    m = RE_YMD.search(t)
    if m:
        y, mo, d, h, mi, ap = m.groups()
        try:
            return _build(y, mo, d, h, mi, ap, ref), m.group(0)
        except ValueError:
            pass
    return None, ""


# ---- OCR engine (RapidOCR) ---------------------------------------------------
_engine = None


def get_engine():
    global _engine
    if _engine is None:
        import logging
        logging.getLogger().setLevel(logging.ERROR)
        from rapidocr_onnxruntime import RapidOCR
        _engine = RapidOCR()
    return _engine


def _prep(crop, target_w=2000):
    crop = crop.convert("RGB")
    if crop.width < target_w:
        s = target_w / crop.width
        crop = crop.resize((int(crop.width * s), int(crop.height * s)), Image.LANCZOS)
    return ImageOps.autocontrast(crop)


def ocr_stamp(img, ref):
    """OCR the bottom strip, then enlarged corners; return (datetime, raw_text)."""
    import numpy as np
    engine = get_engine()
    w, h = img.size
    regions = [
        (0.0, 0.82, 1.0, 1.0),   # full bottom strip
        (0.0, 0.84, 0.58, 1.0),  # bottom-left  (phone watermark)
        (0.18, 0.82, 0.86, 1.0),  # bottom-center (realme / plain)
        (0.48, 0.88, 1.0, 1.0),  # bottom-right (GPS/map style)
    ]
    for l, t, r, b in regions:
        crop = img.crop((int(l * w), int(t * h), int(r * w), int(b * h)))
        result, _ = engine(np.array(_prep(crop)))
        if result:
            text = " ".join(line[1] for line in result)
            dt, matched = parse_stamp(text, ref)
            if dt:
                return dt, matched
    return None, ""


# ---- main --------------------------------------------------------------------
def fmt(dt, date_only=False):
    if not dt:
        return ""
    return dt.strftime("%Y-%m-%d") if date_only else dt.strftime("%Y-%m-%d %H:%M:%S")


def iter_images(folder):
    for p in sorted(Path(folder).iterdir()):
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
            yield p


def run(folder, out_path, use_ocr, disagree_min, chat_map):
    images = list(iter_images(folder))
    if not images:
        sys.exit(f"No images found in {folder}")

    if use_ocr:
        try:
            get_engine()
        except ImportError:
            sys.exit("RapidOCR is not installed.\n"
                     "Install:  pip install rapidocr-onnxruntime numpy\n"
                     "Or run with --no-ocr.")

    wb = Workbook()
    ws = wb.active
    ws.title = "Timestamps"
    ws.append(["filename", "teacher", "best_estimate", "date", "time", "source",
               "capture_time_stamp", "chat_time", "gap_min", "stamp_raw", "review"])

    total = len(images)
    counts = {"stamp": 0, "chat": 0, "filename": 0, "filename_date": 0, "none": 0}
    n_review = 0

    for i, p in enumerate(images, 1):
        chat_dt, teacher = chat_map.get(p.name, (None, ""))
        fdt, has_time = parse_filename(p.name)
        ref = chat_dt or (fdt if has_time else None)

        try:
            img = Image.open(p)
        except Exception as ex:
            ws.append([p.name, teacher, "", "", "", "error", "", fmt(chat_dt),
                       "", f"open failed: {ex}", "yes"])
            counts["none"] += 1
            n_review += 1
            print(f"[{i}/{total}] {p.name}: ERROR {ex}")
            continue

        capture, raw = (None, "")
        if use_ocr:
            try:
                capture, raw = ocr_stamp(img, ref)
            except Exception:
                capture, raw = (None, "")

        date_only = False
        if capture:
            best, source = capture, "stamp"
        elif chat_dt:
            best, source = chat_dt, "chat"
        elif fdt and has_time:
            best, source = fdt, "filename"
        elif fdt:
            best, source, date_only = fdt, "filename_date", True
        else:
            best, source = None, "none"
        counts[source] += 1

        gap = None
        if capture and chat_dt:
            gap = round((capture - chat_dt).total_seconds() / 60)

        review = source in ("none", "filename_date") or (gap is not None and abs(gap) > disagree_min)
        if review:
            n_review += 1

        ws.append([
            p.name, teacher,
            fmt(best, date_only),
            best.strftime("%Y-%m-%d") if best else "",
            "" if (best is None or date_only) else best.strftime("%H:%M:%S"),
            source, fmt(capture), fmt(chat_dt),
            gap if gap is not None else "", raw,
            "yes" if review else "",
        ])
        tag = "   <-- review" if review else ""
        print(f"[{i}/{total}] {p.name}: {fmt(best, date_only) or '(no time)'} "
              f"({source}){'' if gap is None else f'  gap={gap:+d}m'}{tag}")

    wb.save(out_path)
    print(f"\nWrote {out_path}")
    for k in ("stamp", "chat", "filename", "filename_date", "none"):
        if counts[k]:
            label = {"stamp": "capture stamp (OCR)", "chat": "chat export time",
                     "filename": "filename time", "filename_date": "filename date only",
                     "none": "no time found"}[k]
            print(f"  {label:24}: {counts[k]}/{total}")
    print(f"  rows flagged for review : {n_review}/{total}  (filter review = yes)")


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder", help="Folder of photos.")
    ap.add_argument("-o", "--output", default="timestamps.xlsx", help="Output .xlsx path.")
    ap.add_argument("--chat", help="WhatsApp chat-export .txt (for fallback times + teacher names).")
    ap.add_argument("--no-ocr", action="store_true",
                    help="Skip OCR; use chat / filename time only.")
    ap.add_argument("--disagree-min", type=int, default=10,
                    help="Flag review if stamp and chat time differ by more than this (default 10).")
    args = ap.parse_args()

    if not os.path.isdir(args.folder):
        sys.exit(f"{args.folder} is not a folder.")

    chat_map = {}
    if args.chat:
        if not os.path.isfile(args.chat):
            sys.exit(f"Chat file not found: {args.chat}")
        chat_map = parse_chat(args.chat)
        print(f"Loaded {len(chat_map)} attachments from chat export.\n")
    else:
        print("No --chat file given: photos without a readable stamp will have no "
              "time/teacher. Pass --chat to fill those in.\n")

    run(args.folder, args.output, use_ocr=not args.no_ocr,
        disagree_min=args.disagree_min, chat_map=chat_map)


if __name__ == "__main__":
    main()
