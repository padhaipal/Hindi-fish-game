// The STT engines LIFTeracy runs in production (pp-sketch
// src/interfaces/stt/*), called straight from the phone with the same models
// and settings. Every engine with a key runs in parallel; the lesson gets all
// their transcripts, just as the bot does. In the Android app, fetch goes
// through Capacitor's native HTTP (capacitor.config.ts), so CORS doesn't
// apply.
import type { SttKeys } from "./keys";

const TIMEOUT_MS = 8000;

export interface Transcript {
  engine: string;
  text: string;
  error?: string;
}

const HINDI_DIGITS = ["शून्य", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ"];

async function post(url: string, headers: Record<string, string>, form: FormData) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "POST", headers, body: form, signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const wavFile = (wav: Blob) => new File([wav], "answer.wav", { type: "audio/wav" });

async function sarvam(wav: Blob, key: string): Promise<string> {
  const form = new FormData();
  form.append("file", wavFile(wav));
  form.append("model", "saaras:v4");
  form.append("mode", "verbatim");
  form.append("language_code", "hi-IN");
  const json = await post("https://api.sarvam.ai/speech-to-text", { "api-subscription-key": key }, form);
  return json.transcript ?? "";
}

async function azure(wav: Blob, key: string, endpoint: string): Promise<string> {
  const form = new FormData();
  form.append("audio", wavFile(wav));
  form.append("definition", JSON.stringify({ locales: ["hi-IN"] }));
  const json = await post(
    `${endpoint.replace(/\/+$/, "")}/speechtotext/transcriptions:transcribe?api-version=2024-11-15`,
    { "Ocp-Apim-Subscription-Key": key },
    form,
  );
  const text: string = json.combinedPhrases?.[0]?.text ?? "";
  // Same as pp-sketch: Azure writes numbers as digits.
  return text.replace(/\d+/g, (m) => m.split("").map((d) => HINDI_DIGITS[+d]).join(" "));
}

async function bodhan(wav: Blob, key: string): Promise<string> {
  const form = new FormData();
  form.append("file", wavFile(wav));
  form.append("model", "indic-transcribe");
  form.append("language", "hi");
  const json = await post(
    "https://api.bodhan.ai/v1/audio/transcriptions",
    { Authorization: `Bearer ${key}` },
    form,
  );
  return json.text ?? "";
}

export async function transcribe(wav: Blob, keys: SttKeys): Promise<Transcript[]> {
  const jobs: [string, () => Promise<string>][] = [];
  if (keys.sarvamKey) jobs.push(["Sarvam", () => sarvam(wav, keys.sarvamKey)]);
  if (keys.azureKey && keys.azureEndpoint)
    jobs.push(["Azure", () => azure(wav, keys.azureKey, keys.azureEndpoint)]);
  if (keys.bodhanKey) jobs.push(["Bodhan", () => bodhan(wav, keys.bodhanKey)]);
  return Promise.all(
    jobs.map(async ([engine, run]) => {
      try {
        return { engine, text: (await run()).trim() };
      } catch (e) {
        return { engine, text: "", error: (e as Error).message };
      }
    }),
  );
}
