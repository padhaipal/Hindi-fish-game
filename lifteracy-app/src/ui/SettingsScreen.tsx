import { useEffect, useState } from "react";
import { DEFAULT_SERVER, loadServer, saveServer, type SttServer } from "../stt/server";
import { startRecording, type Recorder } from "../stt/recorder";
import { serverEngines, transcribe, type Transcript } from "../stt/engines";

export function SettingsScreen() {
  const [server, setServer] = useState<SttServer>(loadServer);
  const [status, setStatus] = useState<string>("जाँच रहा हूँ…");
  const [saved, setSaved] = useState(false);
  const [rec, setRec] = useState<Recorder | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<Transcript[] | string | null>(null);

  const check = async (s: SttServer) => {
    setStatus("जाँच रहा हूँ…");
    try {
      const engines = await serverEngines(s);
      setStatus(engines.length ? `✅ चालू इंजन: ${engines.join(", ")}` : "⚠️ सर्वर पर अभी कोई STT key नहीं है");
    } catch (e) {
      setStatus(`❌ सर्वर से जुड़ नहीं पाया (${(e as Error).message})`);
    }
  };

  useEffect(() => {
    void check(server);
    // Check once on open; Save checks again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    const s = { url: server.url.trim() || DEFAULT_SERVER.url, accessCode: server.accessCode.trim() };
    saveServer(s);
    setServer(s);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    void check(s);
  };

  const test = async () => {
    if (rec) {
      setRec(null);
      setTesting(true);
      const r = await rec.stop();
      setResult(await transcribe(r.wav));
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

  return (
    <div className="settings">
      <h2>बोलकर जाँच (STT)</h2>
      <p className="hint">
        बच्चे की आवाज़ LIFTeracy के सर्वर पर जाती है, जो उसे उन्हीं speech-to-text इंजनों से पढ़ता है जो WhatsApp बॉट में चलते हैं।
        Keys सर्वर पर रहती हैं, फ़ोन में नहीं। इसके लिए इंटरनेट चाहिए।
      </p>
      <p className="server-status">{status}</p>

      <h3>जाँचें</h3>
      <button className="secondary" onClick={test} disabled={testing}>
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

      <details className="advanced">
        <summary>सर्वर (एडमिन के लिए)</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="field">
            <span>STT server</span>
            <input
              type="url"
              value={server.url}
              placeholder={DEFAULT_SERVER.url}
              onChange={(e) => setServer({ ...server, url: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Access code (only if the server has APP_ACCESS_CODE set)</span>
            <input
              type="password"
              autoComplete="off"
              value={server.accessCode}
              onChange={(e) => setServer({ ...server, accessCode: e.target.value })}
            />
          </label>
          <button type="submit" className="primary">
            {saved ? "✓ सहेजा गया" : "सहेजें"}
          </button>
        </form>
      </details>
      <p className="version">LIFTeracy शिक्षक ऐप · v{__APP_VERSION__}</p>
    </div>
  );
}
