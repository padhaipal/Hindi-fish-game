// ---------------------------------------------------------------------------
// ROOT — single-play build.
// ---------------------------------------------------------------------------
// There is deliberately NO games hub here: each child is sent a direct,
// one-time link to a single game (e.g. /fish?t=<token>), and must not be able
// to navigate to the other games. This page is only shown if someone opens the
// bare domain, so it just points them back to their link.
// ---------------------------------------------------------------------------
export default function Home() {
  return (
    <main className="home">
      <div className="homeCard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="homeLogo" src="/images/shared/padhaipal.jpeg" alt="PadhaiPal" />
        <h1 className="homeTitle">PadhaiPal</h1>
        <p className="homeSub">हिंदी खेल</p>
        <p style={{ marginTop: 18, fontSize: 18, color: "#0a3d57", textAlign: "center", maxWidth: 320 }}>
          अपने खेल का लिंक खोलें 🙂
          <br />
          <span style={{ fontSize: 15, color: "#5a7a88" }}>Please open the game link you were sent.</span>
        </p>
      </div>
    </main>
  );
}
