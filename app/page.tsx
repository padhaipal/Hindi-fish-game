import Link from "next/link";

// ---------------------------------------------------------------------------
// HOME — the PadhaiPal Hindi games collection.
// A simple landing page linking to the two games. Each game is also directly
// reachable at its own URL (/fish and /blocks).
// ---------------------------------------------------------------------------
export default function Home() {
  return (
    <main className="home">
      <div className="homeCard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="homeLogo" src="/images/shared/padhaipal.jpeg" alt="PadhaiPal" />
        <h1 className="homeTitle">PadhaiPal</h1>
        <p className="homeSub">हिंदी खेल</p>

        <nav className="homeButtons">
          <Link href="/fish" className="gameButton gbFish">
            <span className="gameEmoji">🐟</span>
            <span>मछली खेल</span>
          </Link>
          <Link href="/blocks" className="gameButton gbBlocks">
            <span className="gameEmoji">🧩</span>
            <span>ब्लॉक खेल</span>
          </Link>
          <Link href="/memory" className="gameButton gbMemory">
            <span className="gameEmoji">🧠</span>
            <span>याद खेल</span>
          </Link>
        </nav>
      </div>
    </main>
  );
}
