// Sends a recording to the LIFTeracy STT server, which runs every engine
// that has a key (Sarvam, Azure, Bodhan — as in production) and returns all
// their transcripts. In the Android app, fetch goes through Capacitor's
// native HTTP (capacitor.config.ts), so CORS doesn't apply.
import { loadServer, sttEndpoint, type SttServer } from "./server";

const TIMEOUT_MS = 12000;

export interface Transcript {
  engine: string;
  text: string;
  error?: string;
}

const headers = (server: SttServer): Record<string, string> =>
  server.accessCode ? { "X-Access-Code": server.accessCode } : {};

async function call(server: SttServer, init: RequestInit) {
  const res = await fetch(sttEndpoint(server), { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `server ${res.status}`);
  return body;
}

export async function transcribe(wav: Blob, server = loadServer()): Promise<Transcript[]> {
  try {
    // Multipart, not a raw body: Capacitor's native HTTP sends files in a
    // form intact but decodes a raw binary body as text.
    const form = new FormData();
    form.append("audio", new File([wav], "answer.wav", { type: "audio/wav" }));
    const body = await call(server, { method: "POST", headers: headers(server), body: form });
    return body.transcripts ?? [];
  } catch (e) {
    return [{ engine: "server", text: "", error: (e as Error).message }];
  }
}

// The engines the server has keys for; throws if it can't be reached.
export async function serverEngines(server = loadServer()): Promise<string[]> {
  const body = await call(server, { method: "GET", headers: headers(server) });
  return body.engines ?? [];
}
