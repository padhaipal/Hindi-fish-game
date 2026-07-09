"use client";

// ---------------------------------------------------------------------------
// ANALYTICS mount — one invisible component in the root layout.
// ---------------------------------------------------------------------------
// On a game page it:
//   - initialises PostHog (no-op if no key is configured),
//   - fires `game_open` once (this counts a link click — note it fires even on
//     the /used cooldown screen, since that's still a click on the link),
//   - fires a `game_time` { seconds: 10 } HEARTBEAT for every 10s of ACTIVE
//     play (paused while the tab is hidden). Total play time for a session is
//     just the sum of these — robust even on mobile, where the page-unload
//     event is unreliable, so we do NOT depend on it.
// Non-game pages render nothing and record nothing.
// ---------------------------------------------------------------------------

import { useEffect } from "react";
import { initAnalytics, currentGame, track } from "@/lib/analytics";

const HEARTBEAT_S = 10; // emit one game_time every 10s of active play

export default function Analytics(): null {
  useEffect(() => {
    initAnalytics();
    if (!currentGame()) return; // not a game page — nothing to record

    track("game_open");

    // ---- active-time heartbeats (paused while the tab is backgrounded) -----
    let activeMs = 0; // active time not yet emitted as a heartbeat
    let lastTick = performance.now();
    let visible = document.visibilityState === "visible";

    const accumulate = () => {
      const now = performance.now();
      if (visible) activeMs += now - lastTick;
      lastTick = now;
    };
    const onVis = () => {
      accumulate();
      visible = document.visibilityState === "visible";
    };
    // Check a few times a within each heartbeat window; emit one event per whole
    // HEARTBEAT_S of accumulated active play (can emit several if we were busy).
    const timer = window.setInterval(() => {
      accumulate();
      while (activeMs >= HEARTBEAT_S * 1000) {
        activeMs -= HEARTBEAT_S * 1000;
        track("game_time", { seconds: HEARTBEAT_S });
      }
    }, 2500);

    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
