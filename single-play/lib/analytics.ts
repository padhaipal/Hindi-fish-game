// ---------------------------------------------------------------------------
// ANALYTICS (PostHog) — tiny, anonymous, opt-in-by-env, lazy-loaded.
// ---------------------------------------------------------------------------
// Captures just enough to answer three questions on the dashboard:
//   (a) how many times each GAME's links were opened  -> event `game_open`
//   (b) how long each play lasted                      -> event `game_time`
//       (a 10-second heartbeat; sum `seconds` for total active play time)
//   (c) how far into a game players got before leaving -> event `level_reached`
//
// Everything is anonymous: no login, no names — PostHog assigns a random
// per-device id. If NEXT_PUBLIC_POSTHOG_KEY is not set, analytics is completely
// off (every function is a no-op).
//
// posthog-js (~70 kB) is loaded with a DYNAMIC import from initAnalytics(), so
// it is NOT in the initial bundle and never blocks first paint on a slow phone.
// Events fired before it finishes loading are queued and flushed on arrival.
// ---------------------------------------------------------------------------
import type posthogT from "posthog-js";

const GAMES = new Set(["fish", "blocks", "memory", "wordtrain", "pondhop", "lekhan"]);

let ph: typeof posthogT | null = null;
let loading: Promise<void> | null = null;
const queue: { event: string; props: Record<string, unknown> }[] = [];

// Load + initialise PostHog once (client only, only if a key is configured).
export function initAnalytics(): void {
  if (loading || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return; // no key -> analytics disabled
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
  loading = import("posthog-js")
    .then((m) => {
      ph = m.default;
      ph.init(key, {
        api_host: host,
        capture_pageview: true,
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

// Which game the current URL is for, with the link-pool suffix folded away
// (`/blocks-7` -> "blocks"). null on non-game pages.
export function currentGame(): string | null {
  if (typeof window === "undefined") return null;
  const seg = window.location.pathname.split("/")[1] || "";
  const base = seg.replace(/-\d+$/, "");
  return GAMES.has(base) ? base : null;
}

// Capture an event, always tagged with the current game. Queued until PostHog
// has finished loading.
export function track(event: string, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  const payload = { game: currentGame(), ...props };
  // Optional QA seam: only active if a page sets window.__ppDebug (never in
  // production). Lets tests observe events without PostHog's network.
  const w = window as unknown as { __ppDebug?: boolean };
  if (w.__ppDebug) window.dispatchEvent(new CustomEvent("pp:track", { detail: { event, ...payload } }));
  if (ph) ph.capture(event, payload);
  else queue.push({ event, props: payload });
}

// A player reached level `level` (1-based) of the current game. Games with a
// word/round progression (e.g. Word Train) pass the step number here too, so the
// drop-off funnel is uniform across games.
export function trackLevelReached(level: number): void {
  track("level_reached", { level });
}
