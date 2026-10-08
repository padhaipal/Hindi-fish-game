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

  async start(lang: string): Promise<void> {
    this.active = true;
    this.finals = [];
    this.interim = "";
    this.chunks = [];
    this.startedAt = performance.now();

    const R = Recognition();
    if (!R || !isMobile()) await this.startMedia();
    if (R) this.startRecognition(R, lang);
  }

  private async startMedia() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.media = new MediaRecorder(this.stream);
      this.media.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
      this.media.start();
    } catch {
      this.media = null;
    }
  }

  private startRecognition(R: any, lang: string) {
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
    }
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
    this.stream?.getTracks().forEach((t) => t.stop());

    if (this.rec) {
      try {
        this.rec.stop();
      } catch {
        /* ignore */
      }
      // Wait for the last results to arrive (briefly).
      await Promise.race([this.ended, new Promise((r) => setTimeout(r, 2500))]);
    }

    return { transcripts: this.transcripts(), audioUrl, seconds };
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
    this.stream?.getTracks().forEach((t) => t.stop());
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
