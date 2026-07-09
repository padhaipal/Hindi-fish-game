"use client";

// ---------------------------------------------------------------------------
// ANALYTICS mount — one invisible component in the root layout.
// ---------------------------------------------------------------------------
// On a game page it:
//   - initialises PostHog (no-op if no key is configured),
//   - fires `game_open` once (this counts a link click — note it fires even on
//     the /used cooldown screen, since that's still a click on the link),
//   - measures ACTIVE play time (paused while the tab is hidden) and fires a
//     single `game_played` { seconds } when the player leaves the page.
// Non-game pages render nothing and record nothing.
// ---------------------------------------------------------------------------

import { useEffect } from "react";
import { initAnalytics, currentGame, track } from "@/lib/analytics";

export default function Analytics(): null {
  useEffect(() => {
    initAnalytics();
    if (!currentGame()) return; // not a game page — nothing to record

    track("game_open");

    // ---- active-time tracking (paused while the tab is backgrounded) -------
    let activeMs = 0;
    let lastTick = performance.now();
    let visible = document.visibilityState === "visible";
    let sent = false;

    const accumulate = () => {
      const now = performance.now();
      if (visible) activeMs += now - lastTick;
      lastTick = now;
    };
    const onVis = () => {
      accumulate();
      visible = document.visibilityState === "visible";
    };
    // Fire exactly once, when they leave (pagehide is the reliable mobile+desktop
    // "leaving" signal; PostHog sends it via the browser's beacon on unload).
    const flush = () => {
      if (sent) return;
      accumulate();
      sent = true;
      const seconds = Math.round(activeMs / 1000);
      if (seconds >= 1) track("game_played", { seconds });
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
      flush(); // SPA-style unmount (also covers most normal navigations)
    };
  }, []);

  return null;
}
