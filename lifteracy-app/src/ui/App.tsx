import { useEffect, useState } from "react";
import {
  currentLevel,
  loadCurrentStudentId,
  loadStudents,
  saveCurrentStudentId,
  saveStudents,
  type Student,
} from "../store/students";
import { stopSounds } from "../media/player";
import { StudentsScreen } from "./StudentsScreen";
import { LessonScreen } from "./LessonScreen";
import { GamesScreen } from "./GamesScreen";
import { ProgressScreen } from "./ProgressScreen";
import { SettingsScreen } from "./SettingsScreen";

type Tab = "lesson" | "games" | "progress" | "settings";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "lesson", icon: "📖", label: "पाठ" },
  { id: "games", icon: "🎮", label: "खेल" },
  { id: "progress", icon: "📊", label: "प्रगति" },
  { id: "settings", icon: "⚙️", label: "सेटिंग" },
];

export function App() {
  const [students, setStudents] = useState<Student[]>(loadStudents);
  const [currentId, setCurrentId] = useState<string | null>(loadCurrentStudentId);
  const [picking, setPicking] = useState(false);
  const [tab, setTab] = useState<Tab>("lesson");

  useEffect(() => saveStudents(students), [students]);
  useEffect(() => saveCurrentStudentId(currentId), [currentId]);

  const current = students.find((s) => s.id === currentId) ?? null;
  const updateStudent = (s: Student) =>
    setStudents((all) => all.map((x) => (x.id === s.id ? s : x)));

  const switchTab = (t: Tab) => {
    stopSounds();
    setTab(t);
  };

  if (!current || picking) {
    return (
      <StudentsScreen
        students={students}
        currentId={currentId}
        onChange={setStudents}
        onPick={(id) => {
          stopSounds();
          setCurrentId(id);
          setPicking(false);
          setTab("lesson");
        }}
        onClose={current ? () => setPicking(false) : undefined}
      />
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">LIFTeracy</span>
        <button className="student-chip" onClick={() => { stopSounds(); setPicking(true); }}>
          <span className="avatar">{current.name.slice(0, 1)}</span>
          <span className="student-chip-name">{current.name}</span>
          <span className="level">स्तर {currentLevel(current)}</span>
          <span aria-hidden>▾</span>
        </button>
      </header>

      <main className="screen">
        {tab === "lesson" && <LessonScreen key={current.id} student={current} onUpdate={updateStudent} onPlayGame={() => switchTab("games")} />}
        {tab === "games" && <GamesScreen key={current.id} student={current} />}
        {tab === "progress" && <ProgressScreen student={current} />}
        {tab === "settings" && <SettingsScreen />}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => switchTab(t.id)}>
            <span className="tab-icon" aria-hidden>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
