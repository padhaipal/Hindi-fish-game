// Phone port of LiteracyLessonService.processAnswer (pp-sketch
// src/literacy/literacy-lesson/literacy-lesson.service.ts): runs the shared
// lesson machine for one student, records letter scores, and returns the
// state-transition ids (stids) whose media the screen shows next.
import { createActor, type SnapshotFrom } from "xstate";
import {
  machine,
  LETTER_SCORE_FLOOR_STID_SUFFIX,
} from "../engine/literacy-lesson/literacy-lesson.machine";
import type { Student } from "../store/students";
import { gradeAndRecord } from "./scores";
import { selectNextWord } from "./select-word";
import { LESSON_WORDS } from "./words";

type Snapshot = SnapshotFrom<typeof machine>;

// Same as pp-sketch: a lesson left for 15 minutes starts over with a new word.
const LESSON_EXPIRY_MS = 15 * 60 * 1000;
// Same separator pp-sketch puts between the STT engines' transcripts, so the
// end of one and the start of the next can't jointly form a right answer.
export const TRANSCRIPT_JOIN = " ~ ";

export interface LessonView {
  stids: string[];
  word: string;
  // What a right answer is in the current state: the word, or the letter.
  expected: string;
  // `word` | `letter` | `image` | `letterImage` | `letterNoImage` | `complete`
  state: string;
  letter: string | null; // the letter being drilled
  done: boolean;
}

function view(snapshot: Snapshot, stids: string[]): LessonView {
  const ctx = snapshot.context;
  return {
    stids,
    word: ctx.word,
    expected: ctx.answer ?? ctx.word,
    state: String(snapshot.value),
    letter: ctx.wrongLetters[0] ?? null,
    done: snapshot.status === "done",
  };
}

function hasLiveLesson(student: Student, now: number): boolean {
  if (!student.lesson) return false;
  if (now - student.lesson.startedAt > LESSON_EXPIRY_MS) return false;
  return (student.lesson.snapshot as Snapshot).status !== "done";
}

// Resume the student's lesson, or pick a word and start a new one. Starting
// records nothing: like the bot, a turn is only stored once it's answered.
export function openLesson(student: Student): { student: Student; view: LessonView } {
  const now = Date.now();
  if (hasLiveLesson(student, now)) {
    const snapshot = student.lesson!.snapshot as Snapshot;
    return { student, view: view(snapshot, [snapshot.context.stateTransitionId]) };
  }
  const { word, level } = selectNextWord(LESSON_WORDS, student.scores, student.turns);
  const actor = createActor(machine, { input: { word, userMessageId: crypto.randomUUID() } });
  actor.start();
  const snapshot = actor.getPersistedSnapshot() as Snapshot;
  actor.stop();
  return {
    student: { ...student, lesson: { snapshot, word, level, startedAt: now } },
    view: view(snapshot, [snapshot.context.stateTransitionId]),
  };
}

// Feed one answer (all STT engines' transcripts, or the teacher's tap) into
// the student's open lesson.
export function answerLesson(
  student: Student,
  transcripts: string[],
): { student: Student; view: LessonView } {
  const studentAnswer = transcripts.map((t) => t.trim()).filter(Boolean).join(TRANSCRIPT_JOIN);
  if (!student.lesson) throw new Error("answerLesson: no open lesson");
  const stored = student.lesson.snapshot as Snapshot;
  // The machine throws on an empty answer; nothing heard counts as wrong.
  const answer = studentAnswer || "~";
  const actor = createActor(machine, {
    snapshot: {
      ...stored,
      context: { ...stored.context, userMessageId: crypto.randomUUID() },
    } as Snapshot,
    // Ignored when restoring a snapshot; xstate's types still want it.
    input: { word: "", userMessageId: "" },
  });
  actor.start();
  actor.send({ type: "ANSWER", studentAnswer: answer });
  const snapshot = actor.getPersistedSnapshot() as Snapshot;
  actor.stop();

  const { pendingCorrect, pendingIncorrect, stateTransitionId } = snapshot.context;
  const graded = gradeAndRecord(student.scores, pendingCorrect, pendingIncorrect);
  const stids = [
    stateTransitionId,
    ...graded.floored.map((g) => `${g}-${LETTER_SCORE_FLOOR_STID_SUFFIX}`),
  ];
  const done = snapshot.status === "done";
  return {
    student: {
      ...student,
      scores: graded.scores,
      turns: [
        ...student.turns,
        {
          word: student.lesson.word,
          at: Date.now(),
          done,
          stid: stateTransitionId,
          level: student.lesson.level,
        },
      ],
      lesson: { ...student.lesson, snapshot },
    },
    view: view(snapshot, stids),
  };
}

// For the teacher's "wrong" button on a word: an answer with the chosen
// letters swapped for a letter the marker can't confuse with them, so the
// machine drills exactly those letters.
export function answerWithWrongLetters(word: string, wrongIndexes: number[]): string {
  const chars = Array.from(word);
  return chars
    .map((ch, i) => (wrongIndexes.includes(i) ? (ch === "ज" ? "म" : "ज") : ch))
    .join("");
}
