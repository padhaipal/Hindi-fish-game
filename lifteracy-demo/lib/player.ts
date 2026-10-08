// ---------------------------------------------------------------------------
// PLAYER: plays one voice note at a time and reports progress to the UI.
// ---------------------------------------------------------------------------
// A voice note is either a recording (mp3 / the user's own recorded blob) or a
// list of segments mixing text-to-speech and short mp3 clips. Text-to-speech has
// no progress events, so progress there is estimated from the text length.
// ---------------------------------------------------------------------------

import type { Segment } from "./script";

export interface PlayState {
  id: string | null;
  progress: number; // 0..1
}

let state: PlayState = { id: null, progress: 0 };
const listeners = new Set<(s: PlayState) => void>();
const played = new Set<string>();

function emit(next: PlayState) {
  state = next;
  listeners.forEach((l) => l(state));
}

export function subscribe(fn: (s: PlayState) => void): () => void {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export const wasPlayed = (id: string) => played.has(id);

let audioEl: HTMLAudioElement | null = null;
function audio(): HTMLAudioElement {
  if (!audioEl) audioEl = new Audio();
  return audioEl;
}

// Browsers only allow sound after a tap. Call this from the first tap.
const SILENCE =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
export function unlockAudio() {
  try {
    const a = audio();
    a.src = SILENCE;
    a.play().catch(() => {});
  } catch {
    /* ignore */
  }
  try {
    const s = window.speechSynthesis;
    if (s) {
      s.getVoices();
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      s.speak(u);
    }
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------------ voices --

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const s = typeof window !== "undefined" ? window.speechSynthesis : null;
  if (!s) return null;
  const vs = s.getVoices();
  const base = lang.slice(0, 2);
  const find = (p: (v: SpeechSynthesisVoice) => boolean) => vs.find(p) ?? null;
  const exact = (v: SpeechSynthesisVoice) => v.lang.replace("_", "-").toLowerCase() === lang.toLowerCase();
  const sameBase = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith(base);
  // Prefer Google / natural voices, which sound far less robotic.
  const nice = (v: SpeechSynthesisVoice) => /google|natural|neural|premium|enhanced/i.test(v.name);
  return (
    find((v) => exact(v) && nice(v)) ??
    find(exact) ??
    (base === "en" ? find((v) => /en-gb/i.test(v.lang) && nice(v)) ?? find((v) => /en-gb/i.test(v.lang)) : null) ??
    find((v) => sameBase(v) && nice(v)) ??
    find(sameBase)
  );
}

// Rough speaking time for text-to-speech, in seconds.
export function estimateSeconds(segments: Segment[]): number {
  let t = 0;
  for (const s of segments) {
    if ("say" in s) t += Math.max(0.8, s.say.split(/\s+/).length / 2.4);
    else t += 1;
  }
  return t;
}

// ------------------------------------------------------------------- play ---

let token = 0;
let abortSrc: (() => void) | null = null;

function playSrc(url: string, my: number, onTime: (frac: number) => void): Promise<boolean> {
  return new Promise((resolve) => {
    const a = audio();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      a.onended = a.onerror = a.ontimeupdate = null;
      abortSrc = null;
      resolve(ok);
    };
    abortSrc = () => finish(true);
    a.onended = () => finish(true);
    a.onerror = () => finish(false);
    a.ontimeupdate = () => {
      if (my !== token) return finish(true);
      if (a.duration && isFinite(a.duration)) onTime(a.currentTime / a.duration);
    };
    a.src = url;
    a.currentTime = 0;
    a.play().catch(() => finish(false));
  });
}

function speak(text: string, lang: string, my: number): Promise<void> {
  return new Promise((resolve) => {
    const s = window.speechSynthesis;
    if (!s || my !== token) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    u.rate = lang.startsWith("hi") ? 0.9 : 0.95;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    // Some browsers never fire onend; don't hang the conversation.
    window.setTimeout(finish, (estimateSeconds([{ say: text }]) * 1.8 + 2) * 1000);
    s.speak(u);
    try {
      s.resume();
    } catch {
      /* ignore */
    }
  });
}

export function stop() {
  token++;
  try {
    audio().pause();
  } catch {
    /* ignore */
  }
  abortSrc?.();
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
  emit({ id: null, progress: 0 });
}

export interface PlayOpts {
  id: string;
  lang: string;
  url?: string; // a single recording (tried first)
  segments?: Segment[]; // fallback / main content
  seconds: number; // estimated length, for progress
}

// Play a voice note. Resolves when it finishes or is stopped.
export async function play(opts: PlayOpts): Promise<void> {
  stop();
  const my = ++token;
  played.add(opts.id);
  emit({ id: opts.id, progress: 0 });

  if (opts.url) {
    const ok = await playSrc(opts.url, my, (f) => emit({ id: opts.id, progress: f }));
    if (my !== token) return;
    if (ok || !opts.segments) {
      emit({ id: null, progress: 0 });
      return;
    }
  }

  const segs = opts.segments ?? [];
  const total = Math.max(0.5, estimateSeconds(segs));
  let before = 0;
  for (const seg of segs) {
    if (my !== token) return;
    const len = estimateSeconds([seg]);
    const start = performance.now();
    // Animate progress through this segment while it plays.
    const tick = window.setInterval(() => {
      if (my !== token) return window.clearInterval(tick);
      const inSeg = Math.min(len * 0.98, (performance.now() - start) / 1000);
      emit({ id: opts.id, progress: Math.min(0.99, (before + inSeg) / total) });
    }, 80);
    if ("say" in seg) await speak(seg.say, opts.lang, my);
    else await playSrc(seg.src, my, () => {});
    window.clearInterval(tick);
    before += len;
  }
  if (my === token) emit({ id: null, progress: 0 });
}
