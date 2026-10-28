// Students live on the teacher's phone (localStorage inside the app's
// WebView). Each one carries what pp-sketch keeps per user: the latest score
// per letter (the phoneme weightings), the lesson turns that drive word-level
// progression, and the lesson in progress.
import { SEED_SCORES } from "../lesson/seed-scores";

// One row per answered turn, like pp-sketch's literacy_lesson_states.
export interface Turn {
  word: string;
  at: number;
  done: boolean; // the lesson reached `complete` on this turn
  stid: string;
  level: number | null; // the max word length the word was picked at
}

export interface Student {
  id: string;
  name: string;
  createdAt: number;
  scores: Record<string, number>;
  turns: Turn[];
  lesson: { snapshot: unknown; word: string; level: number; startedAt: number } | null;
}

const KEY = "lifteracy.students.v1";
const CURRENT_KEY = "lifteracy.currentStudent.v1";
// Enough history for every progression window (the largest is 15 rows) and
// the recent-word exclusion (10 distinct words).
const MAX_TURNS = 300;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the session still works, it just isn't saved.
  }
}

export function loadStudents(): Student[] {
  return read<Student[]>(KEY, []);
}

export function saveStudents(students: Student[]) {
  write(KEY, students.map((s) => ({ ...s, turns: s.turns.slice(-MAX_TURNS) })));
}

export function loadCurrentStudentId(): string | null {
  return read<string | null>(CURRENT_KEY, null);
}

export function saveCurrentStudentId(id: string | null) {
  write(CURRENT_KEY, id);
}

export function newStudent(name: string): Student {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: Date.now(),
    scores: Object.fromEntries(SEED_SCORES.map((s) => [s.grapheme, s.score])),
    turns: [],
    lesson: null,
  };
}

// The level shown to the teacher: the max word length of the latest lesson.
export function currentLevel(student: Student): number {
  for (let i = student.turns.length - 1; i >= 0; i--) {
    const level = student.turns[i].level;
    if (level != null) return level;
  }
  return 2;
}
