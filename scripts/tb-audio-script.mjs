// ---------------------------------------------------------------------------
// TB GAME — BUILD THE RECORDING SCRIPT
//    node scripts/tb-audio-script.mjs      (or: npm run tb:audio)
// ---------------------------------------------------------------------------
// Walks every scene, choice, result, fact and ending in lib/tb and writes out
// the full list of voice files the game can use:
//
//    docs/tb-audio-script.md   — a recording sheet, in playing order
//    docs/tb-audio-script.csv  — the same list for a spreadsheet
//
// Each row is one recording: the file name to save, and the exact Hindi to say.
// Save the files as public/audio/tb/<file>; the game picks them up with no code
// change, and falls back to the phone's Hindi text-to-speech for any that are
// missing. Re-run this after editing the scenes and the list stays in step.
// ---------------------------------------------------------------------------

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const root = resolve(import.meta.dirname, "..");
const out = mkdtempSync(join(tmpdir(), "tb-audio-"));

// The story is TypeScript, so compile lib/tb to plain JS in a temp folder and
// read the real data — never a second copy of it that could drift.
try {
  execFileSync(
    "npx",
    [
      "tsc",
      "lib/tb/story.ts",
      "lib/tb/engine.ts",
      "lib/tb/uiLines.ts",
      "lib/tb/en.ts",
      "--outDir", out,
      "--rootDir", "lib/tb",
      // CommonJS, so the compiled files can require each other without the
      // explicit .js extensions that Node's ESM loader would demand.
      "--module", "commonjs",
      "--target", "es2020",
      "--skipLibCheck",
    ],
    { cwd: root, stdio: "inherit" }
  );
} catch {
  console.error("Could not compile lib/tb — is `npm install` done?");
  process.exit(1);
}

const load = createRequire(join(out, "index.cjs"));
const { SCENES } = load("./story.js");
const { ENDINGS } = load("./engine.js");
const { UI_LINES } = load("./uiLines.js");
const { HOME_HI, RISKS, WORK_HI } = load("./profile.js");
const { EN_LINES } = load("./en.js");

// ---- collect every line, in the order a player meets them -----------------
const rows = [];
const add = (file, hi, where, kind) => rows.push({ file, hi, where, kind });

for (const line of UI_LINES) {
  add(`${line.id}.mp3`, line.hi, line.where, "स्क्रीन");
  // Right after "this is your household" come the cards it was dealt. Every
  // possible one needs recording, since each game deals a different hand.
  if (line.id === "life_intro") {
    for (const [id, hi] of Object.entries(HOME_HI)) {
      add(`life_home_${id}.mp3`, hi, line.where, "आपका हाल");
    }
    for (const [id, hi] of Object.entries(WORK_HI)) {
      add(`life_work_${id}.mp3`, hi, line.where, "आपका हाल");
    }
    for (const r of RISKS) {
      add(`life_risk_${r.id}.mp3`, r.hi, line.where, "आपका हाल");
    }
  }
}

for (const scene of SCENES) {
  const heard = scene.subHi ? `${scene.hi} ${scene.subHi}` : scene.hi;
  add(`${scene.id}.mp3`, heard, scene.id, "हालात");
  for (const opt of scene.options) {
    add(`${scene.id}_${opt.id}.mp3`, opt.hi, scene.id, "विकल्प");
    add(`${scene.id}_${opt.id}_result.mp3`, opt.result.hi, scene.id, "नतीजा");
    add(`${scene.id}_${opt.id}_result_fact.mp3`, opt.result.factHi, scene.id, "जानकारी");
  }
}

for (const e of Object.values(ENDINGS)) {
  add(`end_${e.id}.mp3`, e.hi, `अंत — ${e.id}`, "अंत");
  add(`end_${e.id}_fact.mp3`, e.factHi, `अंत — ${e.id}`, "जानकारी");
}

// A file name must never be claimed by two different lines.
const seen = new Map();
for (const r of rows) {
  if (seen.has(r.file)) {
    console.error(`Duplicate audio id: ${r.file}\n  1: ${seen.get(r.file)}\n  2: ${r.hi}`);
    process.exit(1);
  }
  seen.set(r.file, r.hi);
}

// ---- is every line translated? -------------------------------------------
// The English game (/tb/en) falls back to Hindi for anything missing, which is
// better than a blank screen but not something to ship, so say so loudly.
const needsEnglish = rows.map((r) => r.file.replace(/\.mp3$/, "")).filter((id) => EN_LINES[id] === undefined);
for (const scene of SCENES) {
  if (scene.subHi && EN_LINES[`${scene.id}_sub`] === undefined) {
    needsEnglish.push(`${scene.id}_sub`);
  }
}
if (needsEnglish.length) {
  console.warn(`\n${needsEnglish.length} line(s) have no English yet (lib/tb/en.ts):`);
  for (const id of needsEnglish) console.warn(`   ${id}`);
} else {
  console.log("Every line has an English translation.");
}

// ---- write the recording sheet -------------------------------------------
const words = rows.reduce((n, r) => n + r.hi.split(/\s+/).length, 0);
const minutes = Math.round(words / 110); // ~110 words a minute, read slowly

const scenes = [...new Set(rows.filter((r) => r.kind !== "स्क्रीन" && r.kind !== "अंत" && !r.where.startsWith("अंत")).map((r) => r.where))];

let md = `# टीबी का सफ़र — audio recording script

**${rows.length} files** · roughly ${words} words · about **${minutes} minutes** of
finished audio (allow 3–4× that in studio time).

Generated from the game itself by \`npm run tb:audio\` — do not edit by hand,
edit the scenes in \`lib/tb/\` and run it again.

## How to record

* Save each file as **\`public/audio/tb/<file name>\`**, exactly as named below.
  The game looks for that name; anything missing falls back to the phone's
  Hindi text-to-speech, so you can record and drop in files a few at a time.
* **mp3**, mono, 44.1 kHz is plenty. Keep the loudness even between files — a
  player will hear dozens of them in a row.
* Read **slowly and plainly**, the way a health worker explains something to a
  patient. Most listeners will have low literacy and no prior knowledge of TB.
* Leave a breath of silence at the start and end of each file, and trim the rest.
* The four kinds of line are read a little differently:
  | Kind | What it is | How to read it |
  | --- | --- | --- |
  | हालात | the situation the player is in | neutral, unhurried |
  | विकल्प | a choice on a button | clear and even — no option should sound like the "right" one |
  | नतीजा | what happened after the choice | plain, never scolding |
  | जानकारी | the true fact behind it | warm and certain — this is the teaching |

`;

let csv = "file,kind,scene,hindi\n";
const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;

let current = "";
for (const r of rows) {
  if (r.where !== current) {
    current = r.where;
    md += `\n### ${current}\n\n| File | Kind | Hindi to say |\n| --- | --- | --- |\n`;
  }
  md += `| \`${r.file}\` | ${r.kind} | ${r.hi.replace(/\|/g, "\\|")} |\n`;
  csv += [r.file, r.kind, r.where, r.hi].map(esc).join(",") + "\n";
}

writeFileSync(join(root, "docs/tb-audio-script.md"), md);
writeFileSync(join(root, "docs/tb-audio-script.csv"), csv);
rmSync(out, { recursive: true, force: true });

console.log(`${rows.length} recordings across ${scenes.length} scenes -> docs/tb-audio-script.md (+ .csv)`);
console.log(`~${words} words, about ${minutes} minutes of finished audio.`);
