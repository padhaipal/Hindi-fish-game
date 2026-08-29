// ---------------------------------------------------------------------------
// HOME — the ALfA English games hub.
// ---------------------------------------------------------------------------
// A simple, child-friendly menu of all the games. Fish, Frog Jump and Writing
// open a lesson picker (each lesson has its own deep link); the rest start
// straight away.
// ---------------------------------------------------------------------------
import Link from "next/link";

interface GameLink {
  href: string;
  label: string;
  emoji: string;
  cls: string;
}

const GAMES: GameLink[] = [
  { href: "/fish", label: "Fish Game", emoji: "🐟", cls: "gbFish" },
  { href: "/pond", label: "Frog Jump", emoji: "🐸", cls: "gbHop" },
  { href: "/writing", label: "Writing", emoji: "✏️", cls: "gbLekhan" },
  { href: "/memory", label: "Memory", emoji: "🧠", cls: "gbMemory" },
  { href: "/train", label: "Word Train", emoji: "🚂", cls: "gbTrain" },
  { href: "/blocks", label: "Blocks", emoji: "🧱", cls: "gbBlocks" },
  { href: "/magic-e", label: "Magic-e", emoji: "🪄", cls: "gbMagic" },
];

export default function Home() {
  return (
    <main className="home">
      <div className="homeCard">
        <div className="alfaBadge" aria-hidden="true">
          AL<span className="alfaF">f</span>A
        </div>
        <h1 className="homeTitle">ALfA English</h1>
        <p className="homeSub">Reading &amp; Writing Games</p>
        <div className="homeButtons">
          {GAMES.map((g) => (
            <Link key={g.href} className={`gameButton ${g.cls}`} href={g.href}>
              <span className="gameEmoji">{g.emoji}</span> {g.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
