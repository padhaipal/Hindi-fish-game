import { useState } from "react";
import { enabledEngines, loadKeys, saveKeys, type SttKeys } from "../stt/keys";
import { startRecording, type Recorder } from "../stt/recorder";
import { transcribe, type Transcript } from "../stt/engines";

const FIELDS: { key: keyof SttKeys; label: string; placeholder: string }[] = [
  { key: "sarvamKey", label: "Sarvam API key", placeholder: "api-subscription-key" },
  { key: "azureKey", label: "Azure Speech key", placeholder: "Ocp-Apim-Subscription-Key" },
  { key: "azureEndpoint", label: "Azure Speech endpoint", placeholder: "https://centralindia.api.cognitive.microsoft.com" },
  { key: "bodhanKey", label: "Bodhan API key", placeholder: "indic-transcribe key" },
];

export function SettingsScreen() {
  const [keys, setKeys] = useState<SttKeys>(loadKeys);
  const [saved, setSaved] = useState(false);
  const [rec, setRec] = useState<Recorder | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<Transcript[] | string | null>(null);

  const save = () => {
    const trimmed = Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, v.trim()])) as unknown as SttKeys;
    saveKeys(trimmed);
    setKeys(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const test = async () => {
    if (rec) {
      setRec(null);
      setTesting(true);
      const r = await rec.stop();
      setResult(await transcribe(r.wav, loadKeys()));
      setTesting(false);
      return;
    }
    setResult(null);
    try {
      setRec(await startRecording());
    } catch {
      setResult("माइक नहीं खुला: फ़ोन की सेटिंग में माइक्रोफ़ोन की अनुमति दें।");
    }
  };

  const engines = enabledEngines(loadKeys());

  return (
    <div className="settings">
      <h2>बोलकर जाँच (STT)</h2>
      <p className="hint">
        LIFTeracy बच्चे की आवाज़ को उन्हीं speech-to-text इंजनों से पढ़ता है जो WhatsApp बॉट में चलते हैं। जिस इंजन की key डालेंगे,
        वह चलेगा; कई हों तो सब साथ चलते हैं। Keys सिर्फ़ इसी फ़ोन पर रहती हैं।
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {FIELDS.map((f) => (
          <label key={f.key} className="field">
            <span>{f.label}</span>
            <input
              type={f.key === "azureEndpoint" ? "url" : "password"}
              autoComplete="off"
              value={keys[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setKeys({ ...keys, [f.key]: e.target.value })}
            />
          </label>
        ))}
        <button type="submit" className="primary">
          {saved ? "✓ सहेजा गया" : "सहेजें"}
        </button>
      </form>

      <h3>जाँचें</h3>
      <p className="hint small">चालू इंजन: {engines.length ? engines.join(", ") : "कोई नहीं"}</p>
      <button className="secondary" onClick={test} disabled={testing || engines.length === 0}>
        {rec ? "⏹ रोकें और पढ़ें" : testing ? "समझ रहा हूँ…" : "🎤 माइक से बोलकर जाँचें"}
      </button>
      {typeof result === "string" && <p className="note">{result}</p>}
      {Array.isArray(result) && (
        <div className="heard">
          {result.map((t) => (
            <div key={t.engine}>
              <small>{t.engine}</small> {t.error ? <em className="err">त्रुटि: {t.error}</em> : t.text || <em>—</em>}
            </div>
          ))}
        </div>
      )}
      <p className="version">LIFTeracy शिक्षक ऐप · v{__APP_VERSION__}</p>
    </div>
  );
}
