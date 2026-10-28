// Copies the lesson engine from a pp-sketch checkout (default: ../../pp-sketch,
// i.e. cloned next to this repo) into src/engine. See src/engine/README.md.
import { copyFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "../../pp-sketch");
const files = [
  ["literacy-lesson/literacy-lesson.machine.ts"],
  ["literacy-lesson/evaluate-answer.utils.ts"],
  ["literacy-lesson/identify-character-status.utils.ts"],
  ["literacy-lesson/sentence-assessment.ts"],
  ["literacy-lesson/word-list.json"],
  ["aser/aser.ts"],
];
for (const [f] of files) {
  copyFileSync(join(root, "src/literacy", f), join("src/engine", f));
  console.log("copied", f);
}
console.log("Now update the commit in src/engine/README.md.");
