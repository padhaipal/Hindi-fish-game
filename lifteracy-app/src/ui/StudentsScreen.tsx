import { useState } from "react";
import { currentLevel, newStudent, type Student } from "../store/students";

interface Props {
  students: Student[];
  currentId: string | null;
  onChange: (students: Student[]) => void;
  onPick: (id: string) => void;
  onClose?: () => void;
}

export function StudentsScreen({ students, currentId, onChange, onPick, onClose }: Props) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);

  const add = () => {
    if (!name.trim()) return;
    const s = newStudent(name);
    onChange([...students, s]);
    setName("");
    onPick(s.id);
  };

  const remove = (s: Student) => {
    if (confirm(`${s.name} को हटाएँ? उनकी सारी प्रगति मिट जाएगी।`)) {
      onChange(students.filter((x) => x.id !== s.id));
    }
  };

  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, "hi"));

  return (
    <div className="app students">
      <header className="topbar">
        <span className="brand">LIFTeracy</span>
        {onClose && (
          <button className="link" onClick={onClose}>
            बंद करें
          </button>
        )}
      </header>
      <main className="screen">
        <h1>अभी कौन पढ़ रहा है?</h1>
        <p className="hint">बच्चे का नाम दबाएँ। हर बच्चे का अपना स्तर और अक्षरों की प्रगति अलग से सहेजी जाती है।</p>

        <ul className="student-list">
          {sorted.map((s) => (
            <li key={s.id}>
              <button className={`student-row ${s.id === currentId ? "current" : ""}`} onClick={() => onPick(s.id)}>
                <span className="avatar big">{s.name.slice(0, 1)}</span>
                <span className="student-row-text">
                  <strong>{s.name}</strong>
                  <small>
                    स्तर {currentLevel(s)} · {s.turns.filter((t) => t.done).length} शब्द पूरे
                  </small>
                </span>
              </button>
              {editing && (
                <button className="delete" onClick={() => remove(s)} aria-label={`${s.name} को हटाएँ`}>
                  🗑️
                </button>
              )}
            </li>
          ))}
        </ul>
        {students.length === 0 && <p className="empty">अभी कोई बच्चा नहीं जुड़ा है। नीचे पहला नाम जोड़ें।</p>}

        <form
          className="add-student"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="नए बच्चे का नाम" aria-label="नए बच्चे का नाम" />
          <button type="submit" className="primary" disabled={!name.trim()}>
            जोड़ें
          </button>
        </form>
        {students.length > 0 && (
          <button className="link" onClick={() => setEditing(!editing)}>
            {editing ? "हो गया" : "बच्चे हटाएँ"}
          </button>
        )}
      </main>
    </div>
  );
}
