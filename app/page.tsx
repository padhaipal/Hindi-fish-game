import Link from "next/link";
import { LETTERS } from "@/lib/letters";

// ---------------------------------------------------------------------------
// HOME — the PadhaiPal Hindi games collection.
// Top: a per-letter "adventure" (a sequence of mini-games for one letter, its
// own deep link at /letter/<id>); then each individual game at its own URL.
//
// The letter games are for young children. "टीबी का सफ़र" (/tb) is a health
// game for adults, built for tb.care, so it sits in its own group below them.
// ---------------------------------------------------------------------------
export default function Home() {
  return (
    <main className="home">
      <div className="homeCard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="homeLogo" src="/images/shared/padhaipal.jpeg" alt="PadhaiPal" />
        <h1 className="homeTitle">PadhaiPal</h1>
        <p className="homeSub">हिंदी खेल</p>

        {/* Per-letter adventures */}
        <h2 className="homeSection">✨ अक्षर की सैर</h2>
        <nav className="homeLetters">
          {LETTERS.map((l) => (
            <Link key={l.id} href={`/letter/${l.id}`} className="letterTile" aria-label={`${l.char} की सैर`}>
              <span className="letterTileChar">{l.char}</span>
              <span className="letterTilePic">{l.id === "la" ? "🌀" : l.emoji}</span>
            </Link>
          ))}
        </nav>

        {/* Individual games */}
        <h2 className="homeSection">🎮 सभी खेल</h2>
        <nav className="homeButtons">
          <Link href="/pondhop" className="gameButton gbHop">
            <span className="gameEmoji">🐸</span>
            <span>छलांग खेल</span>
          </Link>
          <Link href="/fish" className="gameButton gbFish">
            <span className="gameEmoji">🐠</span>
            <span>मछली खेल</span>
          </Link>
          <Link href="/memory" className="gameButton gbMemory">
            <span className="gameEmoji">🧠</span>
            <span>याद खेल</span>
          </Link>
          <Link href="/wordtrain" className="gameButton gbTrain">
            <span className="gameEmoji">🚂</span>
            <span>रेल खेल</span>
          </Link>
          <Link href="/blocks" className="gameButton gbBlocks">
            <span className="gameEmoji">🧩</span>
            <span>ब्लॉक खेल</span>
          </Link>
          <Link href="/lekhan" className="gameButton gbLekhan">
            <span className="gameEmoji">✍️</span>
            <span>लेखन खेल</span>
          </Link>
          <Link href="/matra" className="gameButton gbMatra">
            <span className="gameEmoji">✨</span>
            <span>मात्रा खेल</span>
          </Link>
        </nav>

        <p className="homeGroupLabel">बड़ों के लिए</p>
        <nav className="homeButtons">
          <Link href="/tb" className="gameButton gbTb">
            <span className="gameEmoji">🫁</span>
            <span>टीबी का सफ़र</span>
          </Link>
          <Link href="/tb/en" className="gameButton gbTb gbTbEn">
            <span className="gameEmoji">🫁</span>
            <span>The TB Journey</span>
          </Link>
        </nav>
      </div>
    </main>
  );
}
