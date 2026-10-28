# Lesson engine (copied from pp-sketch)

These files are copied **unchanged** from
[`padhaipal/pp-sketch`](https://github.com/padhaipal/pp-sketch) at commit
`4a5197a` (2026-10-27):

| here | pp-sketch |
|------|-----------|
| `literacy-lesson/literacy-lesson.machine.ts` | `src/literacy/literacy-lesson/literacy-lesson.machine.ts` |
| `literacy-lesson/evaluate-answer.utils.ts` | `src/literacy/literacy-lesson/evaluate-answer.utils.ts` |
| `literacy-lesson/identify-character-status.utils.ts` | `src/literacy/literacy-lesson/identify-character-status.utils.ts` |
| `literacy-lesson/sentence-assessment.ts` | `src/literacy/literacy-lesson/sentence-assessment.ts` |
| `literacy-lesson/word-list.json` | `src/literacy/literacy-lesson/word-list.json` |
| `aser/aser.ts` | `src/literacy/aser/aser.ts` |

They are pure TypeScript (only `xstate`), so the app marks answers and walks
the word → letter → picture → letter-card loop exactly as the WhatsApp bot
does. Don't edit them here: change pp-sketch, then copy them over again
(`npm run engine:sync` from `lifteracy-app/`, with pp-sketch cloned next to
this repo).

The parts of pp-sketch that need a database (`LiteracyLessonService`,
`ScoreService`) are re-implemented for the phone in `src/lesson/`.
