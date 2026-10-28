// POST /api/stt — the teacher app sends a child's answer as 16 kHz mono WAV;
// this sends it to every STT engine that has a key and returns all the
// transcripts. The keys live only in this Vercel project's environment
// variables:
//
//   SARVAM_API_KEY
//   AZURE_SPEECH_KEY + AZURE_SPEECH_ENDPOINT
//   BODHAN_API_KEY
//   APP_ACCESS_CODE   optional: when set, the app must send it (Settings)
//
// The recording comes as multipart/form-data, field `audio`.
//
// Same engines, models and settings as pp-sketch src/interfaces/stt/*.

declare const process: { env: Record<string, string | undefined> };

const TIMEOUT_MS = 8000;
const MAX_BYTES = 2_000_000; // ~60 s of 16 kHz WAV; an answer is a few seconds
const HINDI_DIGITS = ["शून्य", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Access-Code",
};

interface Transcript {
  engine: string;
  text: string;
  error?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });

async function post(url: string, headers: Record<string, string>, form: FormData) {
  const res = await fetch(url, { method: "POST", headers, body: form, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const wavFile = (wav: Blob) => new File([wav], "answer.wav", { type: "audio/wav" });

async function sarvam(wav: Blob, key: string): Promise<string> {
  const form = new FormData();
  form.append("file", wavFile(wav));
  form.append("model", "saaras:v4");
  form.append("mode", "verbatim");
  form.append("language_code", "hi-IN");
  const r = await post("https://api.sarvam.ai/speech-to-text", { "api-subscription-key": key }, form);
  return r.transcript ?? "";
}

async function azure(wav: Blob, key: string, endpoint: string): Promise<string> {
  const form = new FormData();
  form.append("audio", wavFile(wav));
  form.append("definition", JSON.stringify({ locales: ["hi-IN"] }));
  const r = await post(
    `${endpoint.replace(/\/+$/, "")}/speechtotext/transcriptions:transcribe?api-version=2024-11-15`,
    { "Ocp-Apim-Subscription-Key": key },
    form,
  );
  const text: string = r.combinedPhrases?.[0]?.text ?? "";
  // Same as pp-sketch: Azure writes numbers as digits.
  return text.replace(/\d+/g, (m) => m.split("").map((d) => HINDI_DIGITS[+d]).join(" "));
}

async function bodhan(wav: Blob, key: string): Promise<string> {
  const form = new FormData();
  form.append("file", wavFile(wav));
  form.append("model", "indic-transcribe");
  form.append("language", "hi");
  const r = await post("https://api.bodhan.ai/v1/audio/transcriptions", { Authorization: `Bearer ${key}` }, form);
  return r.text ?? "";
}

function engines(): [string, (wav: Blob) => Promise<string>][] {
  const env = process.env;
  const list: [string, (wav: Blob) => Promise<string>][] = [];
  if (env.SARVAM_API_KEY) list.push(["Sarvam", (w) => sarvam(w, env.SARVAM_API_KEY!)]);
  if (env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_ENDPOINT)
    list.push(["Azure", (w) => azure(w, env.AZURE_SPEECH_KEY!, env.AZURE_SPEECH_ENDPOINT!)]);
  if (env.BODHAN_API_KEY) list.push(["Bodhan", (w) => bodhan(w, env.BODHAN_API_KEY!)]);
  return list;
}

const allowed = (request: Request) => {
  const code = process.env.APP_ACCESS_CODE;
  return !code || request.headers.get("x-access-code") === code;
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// GET: which engines are switched on, so the app's Settings can show it.
export function GET(request: Request) {
  if (!allowed(request)) return json({ error: "wrong access code" }, 401);
  return json({ engines: engines().map(([name]) => name) });
}

export async function POST(request: Request) {
  if (!allowed(request)) return json({ error: "wrong access code" }, 401);
  // multipart/form-data with the recording in an `audio` field
  const form = await request.formData().catch(() => null);
  const wav = form?.get("audio");
  if (!(wav instanceof Blob) || wav.size === 0 || wav.size > MAX_BYTES)
    return json({ error: "send the recording (up to 2 MB of WAV) as form field `audio`" }, 400);
  const list = engines();
  if (list.length === 0) return json({ error: "no STT keys set on the server" }, 503);
  const transcripts: Transcript[] = await Promise.all(
    list.map(async ([engine, run]) => {
      try {
        return { engine, text: (await run(wav)).trim() };
      } catch (e) {
        return { engine, text: "", error: (e as Error).message };
      }
    }),
  );
  return json({ transcripts });
}
