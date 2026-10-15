"use client";

// ---------------------------------------------------------------------------
// ANALYTICS mount — one invisible component in the root layout.
// ---------------------------------------------------------------------------
// On every game / letter / matra page it:
//   - initialises PostHog (no-op if no key is configured),
//   - fires `game_open` once per page (counts a link open; re-fires when the
//     child moves on client-side, e.g. the "next letter" button),
//   - fires a `game_time` { seconds: 10 } HEARTBEAT for every 10s of ACTIVE
//     play (paused while the tab is hidden). Total play time is just the sum
//     of these — robust on mobile, where the page-unload event is unreliable.
// The home page and other non-game pages record nothing (beyond a pageview).
// ---------------------------------------------------------------------------

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, currentPage, track } from "@/lib/analytics";

const HEARTBEAT_S = 10; // emit one game_time every 10s of active play

export default function Analytics(): null {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!currentPage(pathname)) return; // not a game page — nothing to record

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
    // Check a few times within each heartbeat window; emit one event per whole
    // HEARTBEAT_S of accumulated active play.
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
  }, [pathname]);

  return null;
}
