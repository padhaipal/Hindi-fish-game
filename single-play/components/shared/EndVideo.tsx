"use client";

// ---------------------------------------------------------------------------
// END-OF-GAME VIDEO — the final reward screen, shared by all six games.
// ---------------------------------------------------------------------------
// When a child finishes the LAST level we play a short celebration video and
// then send them back to the PadhaiPal WhatsApp bot. The clip tries to autoplay
// (with sound); if the browser blocks autoplay-with-sound a big ▶ appears and a
// tap starts it. When the clip ends we redirect straight to WhatsApp; the
// always-present button below is the manual fallback (and the path taken if the
// child never starts the video).
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { stopWinLoseSounds } from "@/lib/audio";

const PADHAIPAL_URL = "https://wa.me/918528097842";
const VIDEO_SRC = "/videos/endgame.mp4";

export default function EndVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const leaving = useRef(false);

  const goToBot = () => {
    if (leaving.current) return; // don't fire twice (onEnded + a stray tap)
    leaving.current = true;
    window.location.href = PADHAIPAL_URL;
  };

  useEffect(() => {
    stopWinLoseSounds(); // cut any applause so it doesn't clash with the video
    videoRef.current?.play().catch(() => {
      /* autoplay-with-sound blocked — the ▶ overlay + a tap will start it */
    });
  }, []);

  const tapPlay = () => {
    videoRef.current?.play().catch(() => {});
  };

  return (
    <div className="overlay">
      <div className="videoCard">
        <div className="endVideoWrap" onClick={tapPlay}>
          <video
            ref={videoRef}
            className="endVideo"
            src={VIDEO_SRC}
            playsInline
            autoPlay
            preload="auto"
            onPlay={() => setStarted(true)}
            onEnded={goToBot}
          />
          {/* shown until the clip is actually playing (e.g. if the browser
              blocks autoplay-with-sound) — tap to start it */}
          {!started && <span className="letterVideoPlay">▶</span>}
        </div>
        {/* Manual path back to the PadhaiPal bot (and the fallback if the video
            was never started, so onEnded never fires). */}
        <a className="bigButton" href={PADHAIPAL_URL}>
          पाठ पर जाएं
        </a>
      </div>
    </div>
  );
}
