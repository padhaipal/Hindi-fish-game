import { currentLevel, type Student } from "../store/students";
import { SEED_SCORES } from "../lesson/seed-scores";
import { MIN_SCORE } from "../lesson/scores";

// A letter has been practised once its score moved off its seed value.
function practised(student: Student) {
  return SEED_SCORES.filter((s) => student.scores[s.grapheme] !== s.score)
    .map((s) => ({ grapheme: s.grapheme, seed: s.score, score: student.scores[s.grapheme] }))
    .sort((a, b) => a.score - b.score);
}

export function ProgressScreen({ student }: { student: Student }) {
  const letters = practised(student);
  const done = student.turns.filter((t) => t.done);
  const firstTry = done.filter((t) => t.stid.endsWith("-word-complete-correct-first")).length;
  const recent = [...new Set([...done].reverse().map((t) => t.word))].slice(0, 12);

  return (
    <div className="progress">
      <h2>{student.name} की प्रगति</h2>
      <div className="stats">
        <div>
          <strong>{currentLevel(student)}</strong>
          <small>शब्द स्तर</small>
        </div>
        <div>
          <strong>{done.length}</strong>
          <small>शब्द पूरे</small>
        </div>
        <div>
          <strong>{firstTry}</strong>
          <small>पहली बार में सही</small>
        </div>
      </div>

      <h3>अक्षरों का स्कोर</h3>
      {letters.length === 0 ? (
        <p className="hint">अभी किसी अक्षर का अभ्यास नहीं हुआ।</p>
      ) : (
        <ul className="letter-scores">
          {letters.map((l) => {
            const good = l.score > l.seed;
            const width = Math.min(100, Math.abs(l.score - l.seed) * 10);
            return (
              <li key={l.grapheme}>
                <span className="ls-char">{l.grapheme}</span>
                <span className="ls-bar">
                  <span className={good ? "up" : "down"} style={{ width: `${width}%` }} />
                </span>
                <span className="ls-num">
                  {l.score > 0 ? "+" : ""}
                  {l.score.toFixed(1)}
                  {l.score <= MIN_SCORE && " ⚠️"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="hint small">
        सही जवाब पर अक्षर का स्कोर +1 बढ़ता है, गलत पर −3 घटता है। सबसे कम स्कोर वाले अक्षरों के शब्द पहले आते हैं।
      </p>

      {recent.length > 0 && (
        <>
          <h3>हाल के शब्द</h3>
          <p className="recent-words">{recent.join(" · ")}</p>
        </>
      )}
    </div>
  );
}
