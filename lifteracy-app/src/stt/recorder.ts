// Records the microphone as 16 kHz mono 16-bit WAV: the one format all three
// STT engines accept as-is (pp-sketch converts WhatsApp's Ogg/Opus to the
// same WAV for Bodhan).
const SAMPLE_RATE = 16000;

export interface Recording {
  wav: Blob;
  durationMs: number;
  peak: number; // 0–1, to tell "silence" from "said something"
}

export interface Recorder {
  stop(): Promise<Recording>;
  cancel(): void;
}

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });
  const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
  const source = ctx.createMediaStreamSource(stream);
  // ScriptProcessor is deprecated but works in every Android WebView, with no
  // separate worklet file to load.
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  let peak = 0;
  processor.onaudioprocess = (e) => {
    const data = new Float32Array(e.inputBuffer.getChannelData(0));
    for (const v of data) peak = Math.max(peak, Math.abs(v));
    chunks.push(data);
  };
  source.connect(processor);
  processor.connect(ctx.destination);

  const release = () => {
    processor.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };

  return {
    async stop() {
      release();
      const samples = concat(chunks);
      return {
        wav: encodeWav(samples, ctx.sampleRate),
        durationMs: Math.round((samples.length / ctx.sampleRate) * 1000),
        peak,
      };
    },
    cancel: release,
  };
}

function concat(chunks: Float32Array[]): Float32Array {
  const out = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, s: string) =>
    [...s].forEach((ch, i) => view.setUint8(offset + i, ch.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((v, i) => {
    const s = Math.max(-1, Math.min(1, v));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  });
  return new Blob([buffer], { type: "audio/wav" });
}
