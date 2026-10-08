// ---------------------------------------------------------------------------
// RECORDER: the learner's voice message.
// ---------------------------------------------------------------------------
// Uses the browser's own speech recognition (Web Speech API; Chrome and Edge,
// desktop and Android, and recent Safari) to turn the voice message into text,
// and, where it's safe to, MediaRecorder so the learner can play their message
// back. On phones we skip MediaRecorder: two things holding the microphone at
// once makes Android's speech recognition fail.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Recording {
  transcripts: string[]; // best guess first, then alternatives
  heardSound: boolean; // the mic picked up sound, even if no words came back
  audioUrl?: string;
  seconds: number;
}

function Recognition(): any {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const sttSupported = () => !!Recognition();

const isMobile = () =>
  typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

export class Recorder {
  private rec: any = null;
  private media: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private finals: string[][] = []; // per result: its alternatives
  private interim = "";
  private active = false;
  private ended: Promise<void> = Promise.resolve();
  private endResolve: () => void = () => {};
  private startedAt = 0;
  private heard = false;
  private analyser: AnalyserNode | null = null;
  private ctx: AudioContext | null = null;
  private buf: Uint8Array<ArrayBuffer> | null = null;

  // `onListening` fires once the microphone is actually live: speech before
  // that is lost, so the UI waits for it before saying "speak now".
  async start(lang: string, onListening: () => void): Promise<void> {
    this.active = true;
    this.finals = [];
    this.interim = "";
    this.chunks = [];
    this.heard = false;
    this.startedAt = performance.now();

    const R = Recognition();
    if (!R || !isMobile()) await this.startMedia();
    if (R) this.startRecognition(R, lang, onListening);
    else onListening();
  }

  // Microphone loudness 0..1 for the level meter, or null when not measured.
  level(): number | null {
    if (!this.analyser || !this.buf) return null;
    this.analyser.getByteTimeDomainData(this.buf);
    let peak = 0;
    for (const b of this.buf) peak = Math.max(peak, Math.abs(b - 128));
    const level = Math.min(1, peak / 64);
    if (level > 0.25) this.heard = true;
    return level;
  }

  private async startMedia() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.media = new MediaRecorder(this.stream);
      this.media.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
      this.media.start();
      try {
        this.ctx = new AudioContext();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 512;
        this.buf = new Uint8Array(this.analyser.fftSize);
        this.ctx.createMediaStreamSource(this.stream).connect(this.analyser);
      } catch {
        this.analyser = null;
      }
    } catch {
      this.media = null;
    }
  }

  private startRecognition(R: any, lang: string, onListening: () => void) {
    const rec = new R();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 5;
    this.ended = new Promise((r) => (this.endResolve = r));
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          const alts: string[] = [];
          for (let j = 0; j < res.length; j++) alts.push(res[j].transcript.trim());
          this.finals.push(alts.filter(Boolean));
        } else interim += res[0].transcript;
      }
      this.interim = interim.trim();
    };
    let live = false;
    rec.onaudiostart = () => {
      if (!live) onListening();
      live = true;
    };
    rec.onsoundstart = rec.onspeechstart = () => (this.heard = true);
    rec.onerror = () => {};
    rec.onend = () => {
      // Phones stop listening after a pause; keep going until "send".
      if (this.active) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through */
        }
      }
      this.endResolve();
    };
    try {
      rec.start();
      this.rec = rec;
    } catch {
      this.endResolve();
      onListening();
    }
  }

  private release() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.analyser = null;
  }

  async stop(): Promise<Recording> {
    this.active = false;
    const seconds = Math.max(1, Math.round((performance.now() - this.startedAt) / 1000));

    let audioUrl: string | undefined;
    if (this.media && this.media.state !== "inactive") {
      const stopped = new Promise<void>((r) => (this.media!.onstop = () => r()));
      this.media.stop();
      await stopped;
      if (this.chunks.length) audioUrl = URL.createObjectURL(new Blob(this.chunks, { type: this.media.mimeType }));
    }
    this.release();

    if (this.rec) {
      try {
        this.rec.stop();
      } catch {
        /* ignore */
      }
      // Wait for the last results to arrive (briefly).
      await Promise.race([this.ended, new Promise((r) => setTimeout(r, 2500))]);
    }

    return { transcripts: this.transcripts(), audioUrl, seconds, heardSound: this.heard };
  }

  cancel() {
    this.active = false;
    try {
      this.rec?.abort();
    } catch {
      /* ignore */
    }
    try {
      if (this.media && this.media.state !== "inactive") this.media.stop();
    } catch {
      /* ignore */
    }
    this.release();
  }

  private transcripts(): string[] {
    if (!this.finals.length) return this.interim ? [this.interim] : [];
    const best = this.finals.map((a) => a[0]).join(" ").trim();
    const out = [best];
    // Alternatives only make sense for a single utterance.
    if (this.finals.length === 1) out.push(...this.finals[0].slice(1));
    // Android sometimes repeats the whole phrase in each result; also offer the last.
    if (this.finals.length > 1) out.push(this.finals[this.finals.length - 1][0]);
    return out.filter(Boolean);
  }
}
