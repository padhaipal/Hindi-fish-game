import { useEffect, useRef, useState } from "react";
import type { Student } from "../store/students";
import { answerLesson, answerWithWrongLetters, openLesson, type LessonView } from "../lesson/session";
import { mediaForTurn } from "../media/manifest";
import { playEffect, playSounds, stopSounds } from "../media/player";
import { startRecording, type Recorder } from "../stt/recorder";
import { transcribe, type Transcript } from "../stt/engines";
import { enabledEngines, loadKeys } from "../stt/keys";
import { VisualCard } from "./VisualCard";

type Phase = "ready" | "recording" | "thinking" | "pickLetters";

const STEP_LABEL: Record<string, string> = {
  word: "शब्द पढ़ो",
  letter: "अक्षर पहचानो",
  image: "चित्र का नाम बताओ",
  letterImage: "पहली आवाज़ बताओ",
  letterNoImage: "अक्षर पहचानो",
  complete: "पूरा हुआ",
};

interface Props {
  student: Student;
  onUpdate: (s: Student) => void;
  onPlayGame: () => void;
}

export function LessonScreen({ student, onUpdate, onPlayGame }: Props) {
  const [view, setView] = useState<LessonView | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [heard, setHeard] = useState<Transcript[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [wrongIdx, setWrongIdx] = useState<number[]>([]);
  const recorder = useRef<Recorder | null>(null);
  // Always the latest student, for async callbacks.
  const studentRef = useRef(student);
  studentRef.current = student;
  const engines = enabledEngines(loadKeys());

  const show = (v: LessonView) => {
    setView(v);
    setPhase("ready");
    setWrongIdx([]);
    void playSounds(mediaForTurn(v.stids).sounds);
  };

  const open = () => {
    const opened = openLesson(studentRef.current);
    if (opened.student !== studentRef.current) onUpdate(opened.student);
    setHeard(null);
    setNote(null);
    show(opened.view);
  };

  useEffect(() => {
    open();
    return () => {
      stopSounds();
      recorder.current?.cancel();
    };
    // Open once per student: App remounts this screen when the student changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (transcripts: string[]) => {
    const result = answerLesson(studentRef.current, transcripts);
    onUpdate(result.student);
    if (result.view.done) playEffect("clap");
    show(result.view);
  };

  const startMic = async () => {
    stopSounds();
    setNote(null);
    setHeard(null);
    try {
      recorder.current = await startRecording();
      setPhase("recording");
    } catch {
      setNote("माइक नहीं खुला। फ़ोन की सेटिंग में LIFTeracy को माइक्रोफ़ोन की अनुमति दें।");
    }
  };

  const stopMic = async () => {
    const rec = recorder.current;
    recorder.current = null;
    if (!rec) return;
    setPhase("thinking");
    const recording = await rec.stop();
    if (recording.durationMs < 400 || recording.peak < 0.02) {
      setPhase("ready");
      setNote("कुछ सुनाई नहीं दिया। माइक दबाकर, बोलकर, फिर से दबाएँ।");
      return;
    }
    const transcripts = await transcribe(recording.wav, loadKeys());
    setHeard(transcripts);
    const texts = transcripts.map((t) => t.text).filter(Boolean);
    if (texts.length === 0) {
      setPhase("ready");
      setNote("आवाज़ समझ नहीं आई। फिर से बोलें, या नीचे ✅ / ❌ से बताएँ।");
      return;
    }
    submit(texts);
  };

  if (!view) return null;
  const media = mediaForTurn(view.stids);
  const busy = phase === "recording" || phase === "thinking";

  return (
    <div className="lesson">
      <div className="step-label">
        <span>{STEP_LABEL[view.state] ?? view.state}</span>
        <span className="word-tag">{view.word}</span>
      </div>

      <div className="card-area">
        {media.visual && <VisualCard visual={media.visual} />}
        <button className="replay" onClick={() => playSounds(media.sounds)} disabled={busy} aria-label="फिर से सुनो">
          🔊 फिर सुनो
        </button>
      </div>

      {heard && (
        <div className="heard">
          {heard.map((t) => (
            <div key={t.engine}>
              <small>{t.engine}</small> {t.error ? <em className="err">त्रुटि: {t.error}</em> : t.text || <em>—</em>}
            </div>
          ))}
        </div>
      )}
      {note && <p className="note">{note}</p>}

      {view.done ? (
        <div className="done-actions">
          <button className="primary big" onClick={open}>
            अगला शब्द ➜
          </button>
          <button className="secondary big" onClick={onPlayGame}>
            🎮 खेल खेलो
          </button>
        </div>
      ) : phase === "pickLetters" ? (
        <div className="pick-letters">
          <p>कौन सा अक्षर गलत पढ़ा?</p>
          <div className="letter-chips">
            {Array.from(view.word).map((ch, i) => (
              <button
                key={i}
                className={wrongIdx.includes(i) ? "chip on" : "chip"}
                onClick={() => setWrongIdx((w) => (w.includes(i) ? w.filter((x) => x !== i) : [...w, i]))}
              >
                {ch}
              </button>
            ))}
          </div>
          <div className="row">
            <button className="secondary" onClick={() => setPhase("ready")}>
              रद्द करें
            </button>
            <button
              className="primary"
              onClick={() => submit([wrongIdx.length ? answerWithWrongLetters(view.word, wrongIdx) : "~"])}
            >
              {wrongIdx.length ? "ठीक है" : "पूरा गलत"}
            </button>
          </div>
        </div>
      ) : (
        <div className="answer-area">
          {engines.length > 0 ? (
            <button
              className={`mic ${phase}`}
              onClick={phase === "recording" ? stopMic : startMic}
              disabled={phase === "thinking"}
              aria-label={phase === "recording" ? "रोकें" : "बोलें"}
            >
              {phase === "recording" ? "⏹" : phase === "thinking" ? "…" : "🎤"}
            </button>
          ) : (
            <p className="hint small">
              बोलकर जाँचने के लिए <b>सेटिंग</b> में STT key डालें। तब तक बच्चे का जवाब सुनकर ✅ या ❌ दबाएँ।
            </p>
          )}
          <p className="mic-hint">
            {phase === "recording" ? "सुन रहा हूँ… बोलने के बाद दबाएँ" : phase === "thinking" ? "समझ रहा हूँ…" : engines.length ? "दबाएँ और बोलें" : ""}
          </p>
          <div className="teacher-row">
            <span>शिक्षक:</span>
            <button className="ok" disabled={busy} onClick={() => submit([view.expected])}>
              ✅ सही
            </button>
            <button
              className="no"
              disabled={busy}
              onClick={() => (view.state === "word" && Array.from(view.word).length > 1 ? setPhase("pickLetters") : submit(["~"]))}
            >
              ❌ गलत
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
