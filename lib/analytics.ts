// ---------------------------------------------------------------------------
// ANALYTICS (PostHog) — tiny, anonymous, opt-in-by-env, lazy-loaded.
// ---------------------------------------------------------------------------
// Same approach as single-play/lib/analytics.ts, extended so every event says
// WHICH LETTER / MATRA it was about. Answers:
//   - how often each game / letter / matra link is opened   -> `game_open`
//   - how long children actively play it                    -> `game_time`
//     (a 10-second heartbeat; sum `seconds` for total active play time)
//   - how far through a letter/matra journey they get       -> `step_reached`
//   - how many finish the whole journey                     -> `adventure_complete`
//
// Every event carries:
//   game   — "letter" | "matra" | "fish" | "blocks" | "memory" | "wordtrain"
//            | "pondhop" | "lekhan" | "tb"
//   letter — the letter id for /letter/<id> pages (e.g. "ka"), else absent
//   matra  — the matra id for /matra/<id> pages (e.g. "aa"), else absent
//
// Everything is anonymous: no login, no names — PostHog assigns a random
// per-device id. If NEXT_PUBLIC_POSTHOG_KEY is not set, analytics is completely
// off (every function is a no-op).
//
// posthog-js is loaded with a DYNAMIC import from initAnalytics(), so it is NOT
// in the initial bundle and never blocks first paint on a slow phone. Events
// fired before it finishes loading are queued and flushed on arrival.
// ---------------------------------------------------------------------------
import type posthogT from "posthog-js";

const GAMES = new Set(["fish", "blocks", "memory", "wordtrain", "pondhop", "lekhan", "tb"]);

export type PageInfo = { game: string; letter?: string; matra?: string };

let ph: typeof posthogT | null = null;
let loading: Promise<void> | null = null;
const queue: { event: string; props: Record<string, unknown> }[] = [];

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Load + initialise PostHog once (client only, only if a key is configured).
export function initAnalytics(): void {
  if (loading || typeof window === "undefined" || !KEY) return;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
  loading = import("posthog-js")
    .then((m) => {
      ph = m.default;
      ph.init(KEY, {
        api_host: host,
        // Count client-side navigations too (e.g. the "next letter" button).
        capture_pageview: "history_change",
        autocapture: false, // only our own explicit events (+ pageviews)
        persistence: "localStorage+cookie",
      });
      for (const q of queue) ph.capture(q.event, q.props);
      queue.length = 0;
    })
    .catch(() => {
      /* couldn't load — analytics simply stays off */
    });
}

// What the current URL is: a letter journey, a matra journey, a standalone
// game, or nothing trackable (home page etc. -> null).
//   /letter/ka -> { game: "letter", letter: "ka" }
//   /matra/aa  -> { game: "matra",  matra: "aa" }
//   /fish      -> { game: "fish" }
//   /tb/en     -> { game: "tb" }
export function currentPage(pathname?: string): PageInfo | null {
  const path = pathname ?? (typeof window === "undefined" ? "" : window.location.pathname);
  const [seg0 = "", seg1 = ""] = path.split("/").filter(Boolean);
  if (seg0 === "letter" && seg1) return { game: "letter", letter: decodeURIComponent(seg1) };
  if (seg0 === "matra" && seg1) return { game: "matra", matra: decodeURIComponent(seg1) };
  const base = seg0.replace(/-\d+$/, ""); // fold any link-pool suffix (/blocks-7)
  return GAMES.has(base) ? { game: base } : null;
}

// Capture an event, always tagged with the current game / letter / matra.
// Queued until PostHog has finished loading.
export function track(event: string, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !KEY) return;
  const payload = { ...(currentPage() ?? { game: null }), ...props };
  if (ph) ph.capture(event, payload);
  else queue.push({ event, props: payload });
}

// A child started step `stepNumber` (1-based) of a letter/matra journey.
// `step` is the step's key (e.g. "fish", "trace") so drop-off is readable.
export function trackStepReached(step: string, stepNumber: number, totalSteps: number): void {
  track("step_reached", { step, step_number: stepNumber, total_steps: totalSteps });
}

// A child finished every step of a letter/matra journey.
export function trackAdventureComplete(totalSteps: number): void {
  track("adventure_complete", { total_steps: totalSteps });
}
