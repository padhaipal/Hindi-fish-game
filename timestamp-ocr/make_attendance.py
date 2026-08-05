#!/usr/bin/env python3
r"""
Reshape the per-photo timestamp sheet (from ocr_timestamps.py) into the
teacher-attendance grid: dates down the side, and each class's Start / End /
Total across the top, matching teacher_attendance_format.xlsx.

For each class on each day:
  * Start = time of the first photo, End = time of the last photo,
    Total = End - Start (the session length).
  * Photos are assigned to a class by the scheduled time in the template's
    row 5 (nearest window), so a teacher who runs two classes at different
    times is split correctly even if a class shifts a bit. For two classes at
    the SAME scheduled time (Anjum), the day's photos are split by the largest
    gap, earlier session -> earlier class (template order).

Highlighting:
  * RED    = teacher absent (no photos) on a working day (Mon-Sat).
  * ORANGE = only one photo that day (a start or an end, but not both).
  * A class with no photos all month (e.g. Heena this month) is left blank.

Usage:
    python make_attendance.py June_timestamps.xlsx \
        --template "teacher_attendance_format.xlsx" -o June_attendance.xlsx

Edit the CONFIG block below if teachers/classes/mappings change.
"""

import argparse
import datetime
import re
import sys

from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Alignment, Font
from openpyxl.utils import get_column_letter

# ============================ CONFIG =========================================
# Rename a chat sender to the teacher name used in the template.
SENDER_RENAME = {"mariyam": "Ishrat"}

# Match a sender (case-insensitive substring) to a canonical teacher.
SENDER_MATCH = {
    "afreen": "Afreen",
    "anjum": "Anjum",
    "nahid": "Nahid",
    "heena": "Heena",
    "ishrat": "Ishrat",
    "mariyam": "Ishrat",
}

def _m(t):  # "H:MM" -> minutes since midnight
    h, mm = t.split(":")
    return int(h) * 60 + int(mm)

# Each teacher -> ordered list of classes (template order). Each class:
#   col   = 1-based column of its "Start" cell (Start,End,Total,Prize follow)
#   win   = (start_min, end_min) scheduled window from template row 5
# Column groups: C1=B(2) C2=F(6) C3=J(10) C4=N(14) C5=R(18) C6=V(22) C7=Z(26) C8=AD(30)
TEACHERS = {
    "Ishrat": [{"col": 2,  "win": (_m("9:30"),  _m("11:29"))},   # C1 home
               {"col": 26, "win": (_m("16:30"), _m("18:00"))}],  # C7 Daliganj
    "Anjum":  [{"col": 6,  "win": (_m("10:00"), _m("11:30"))},   # C2 Anjum 1st
               {"col": 10, "win": (_m("10:00"), _m("11:30"))}],  # C3 Anjum 2nd (same time)
    "Afreen": [{"col": 14, "win": (_m("15:00"), _m("16:29"))},   # C4 Bisti Tula
               {"col": 18, "win": (_m("16:30"), _m("18:00"))}],  # C5 Daliganj Station
    "Nahid":  [{"col": 30, "win": (_m("17:00"), _m("18:30"))}],  # C8 Mariyaon
    "Heena":  [{"col": 22, "win": (_m("15:00"), _m("16:30"))}],  # C6 (blank this month)
}

FIRST_DATA_ROW = 10          # data rows start here in the template
GAP_SPLIT_MIN = 75           # min gap (minutes) to split a same-time class pair
RED = PatternFill("solid", fgColor="FFFFC7CE")     # absent
ORANGE = PatternFill("solid", fgColor="FFFFC000")  # only one photo
# =============================================================================


def canon_teacher(sender):
    s = (sender or "").strip().lower()
    for key, name in SENDER_MATCH.items():
        if key in s:
            return name
    return None


def parse_dt(row, headers):
    """Get a datetime from a per-photo row (prefers best_estimate)."""
    def val(col):
        i = headers.get(col)
        return row[i] if i is not None and i < len(row) else None
    be = val("best_estimate")
    if isinstance(be, datetime.datetime):
        return be
    if isinstance(be, str) and be.strip():
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
            try:
                return datetime.datetime.strptime(be.strip(), fmt)
            except ValueError:
                pass
    return None  # date-only / no time -> not usable for Start/End


def load_photos(path):
    wb = load_workbook(path, read_only=True)
    ws = wb.active
    rows = ws.iter_rows(values_only=True)
    header = [str(c).strip() if c is not None else "" for c in next(rows)]
    headers = {name: i for i, name in enumerate(header)}
    if "teacher" not in headers:
        sys.exit("Input sheet has no 'teacher' column - is this the ocr_timestamps output?")
    photos = []  # (teacher, datetime)
    for row in rows:
        if row is None or all(c is None for c in row):
            continue
        t_i = headers["teacher"]
        teacher = canon_teacher(row[t_i] if t_i < len(row) else "")
        if not teacher:
            continue
        dt = parse_dt(row, headers)
        if dt:
            photos.append((teacher, dt))
    return photos


def assign(teacher, times):
    """times: sorted list of minutes-of-day. Return {col: [minutes...]}."""
    classes = TEACHERS[teacher]
    out = {c["col"]: [] for c in classes}
    if not times:
        return out
    if len(classes) == 1:
        out[classes[0]["col"]] = times[:]
        return out
    same = classes[0]["win"] == classes[1]["win"]
    if same:
        if len(times) >= 2:
            gaps = [(times[i + 1] - times[i], i) for i in range(len(times) - 1)]
            mg, idx = max(gaps)
            if mg >= GAP_SPLIT_MIN:
                out[classes[0]["col"]] = times[:idx + 1]
                out[classes[1]["col"]] = times[idx + 1:]
                return out
        out[classes[0]["col"]] = times[:]  # one session -> first class
        return out
    # distinct windows: nearest scheduled window (0 if inside)
    def dist(t, c):
        s, e = c["win"]
        return 0 if s <= t <= e else (s - t if t < s else t - e)
    for t in times:
        best = min(classes, key=lambda c: dist(t, c))
        out[best["col"]].append(t)
    return out


def hhmm(minutes):
    return f"{minutes // 60}:{minutes % 60:02d}"


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("photos", help="Per-photo .xlsx from ocr_timestamps.py")
    ap.add_argument("--template", required=True, help="teacher_attendance_format.xlsx")
    ap.add_argument("-o", "--output", default="attendance.xlsx")
    args = ap.parse_args()

    photos = load_photos(args.photos)
    if not photos:
        sys.exit("No photos with a recognized teacher + time were found.")

    # Rename senders already handled by SENDER_MATCH -> canonical names.
    # Group: {(teacher, date): [minutes...]}
    by_key = {}
    all_dates = set()
    for teacher, dt in photos:
        d = dt.date()
        all_dates.add(d)
        by_key.setdefault((teacher, d), []).append(dt.hour * 60 + dt.minute)

    # Per (col, date) -> sorted session minutes
    cell_times = {}          # (col, date) -> [minutes...]
    col_has_data = set()     # cols with any photo all month
    for (teacher, d), mins in by_key.items():
        mins.sort()
        for col, tmins in assign(teacher, mins).items():
            if tmins:
                cell_times[(col, d)] = sorted(tmins)
                col_has_data.add(col)

    lo, hi = min(all_dates), max(all_dates)
    dates = [lo + datetime.timedelta(days=i) for i in range((hi - lo).days + 1)]

    wb = load_workbook(args.template)
    ws = wb.active

    # Clear old data rows (values + fills) from FIRST_DATA_ROW down.
    max_col = 33  # through AG (col 33)
    for r in range(FIRST_DATA_ROW, ws.max_row + 1):
        for c in range(1, max_col + 1):
            cell = ws.cell(row=r, column=c)
            cell.value = None
            cell.fill = PatternFill()

    all_cols = [c["col"] for cs in TEACHERS.values() for c in cs]
    center = Alignment(horizontal="center")

    for i, d in enumerate(dates):
        r = FIRST_DATA_ROW + i
        label = f"{d.strftime('%a')}, {d.strftime('%b')} {d.day}, {d.strftime('%y')}"
        ws.cell(row=r, column=1, value=label)
        working = d.weekday() <= 5  # Mon(0)..Sat(5) ; Sunday excluded
        for col in all_cols:
            if col not in col_has_data:
                continue  # class inactive all month -> leave blank
            start_c = ws.cell(row=r, column=col)
            end_c = ws.cell(row=r, column=col + 1)
            total_c = ws.cell(row=r, column=col + 2)
            for c in (start_c, end_c, total_c):
                c.alignment = center
            times = cell_times.get((col, d))
            if not times:
                if working:
                    for c in (start_c, end_c, total_c):
                        c.fill = RED
                continue
            if len(times) == 1:
                start_c.value = hhmm(times[0])
                start_c.fill = end_c.fill = total_c.fill = ORANGE
            else:
                start_c.value = hhmm(times[0])
                end_c.value = hhmm(times[-1])
                total_c.value = hhmm(times[-1] - times[0])

    wb.save(args.output)
    ncells = sum(1 for _ in cell_times)
    print(f"Wrote {args.output}")
    print(f"  dates: {lo} .. {hi}  ({len(dates)} rows)")
    print(f"  active class-columns: {sorted(col_has_data, key=lambda c: c)}"
          f"  ({len(col_has_data)} of {len(all_cols)})")
    print(f"  filled class/day sessions: {ncells}")


if __name__ == "__main__":
    main()
