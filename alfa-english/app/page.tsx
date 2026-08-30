// ---------------------------------------------------------------------------
// HOME — the ALfA English games hub.
// ---------------------------------------------------------------------------
// Games are grouped so the growing list stays scannable. Fish, Frog Jump and
// Writing open a lesson picker (each lesson has its own deep link); the rest
// start straight away. Every game has its own shareable URL.
// ---------------------------------------------------------------------------
import Link from "next/link";

interface GameLink {
  href: string;
  label: string;
  emoji: string;
  cls: string;
}

interface Group {
  title: string;
  games: GameLink[];
}

const GROUPS: Group[] = [
  {
    title: "Letters",
    games: [
      { href: "/fish", label: "Fish Game", emoji: "🐟", cls: "gbFish" },
      { href: "/pond", label: "Frog Jump", emoji: "🐸", cls: "gbHop" },
      { href: "/writing", label: "Writing", emoji: "✏️", cls: "gbLekhan" },
    ],
  },
  {
    title: "Sounds & Words",
    games: [
      { href: "/memory", label: "Memory", emoji: "🧠", cls: "gbMemory" },
      { href: "/blocks", label: "Blocks", emoji: "🧱", cls: "gbBlocks" },
      { href: "/train", label: "Word Train", emoji: "🚂", cls: "gbTrain" },
      { href: "/word-machine", label: "Word Machine", emoji: "🎡", cls: "gbMachine" },
      { href: "/rhyme", label: "Rhyme Time", emoji: "🎵", cls: "gbRhyme" },
      { href: "/detective", label: "Sound Detective", emoji: "🕵️", cls: "gbDetective" },
      { href: "/sentence", label: "Sentence Builder", emoji: "📝", cls: "gbSentence" },
      { href: "/silly", label: "Silly Sentences", emoji: "🤪", cls: "gbSilly" },
      { href: "/magic-e", label: "Magic-e", emoji: "🪄", cls: "gbMagic" },
    ],
  },
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
        {GROUPS.map((g) => (
          <div key={g.title} className="homeGroup">
            <div className="homeGroupTitle">{g.title}</div>
            <div className="homeButtons">
              {g.games.map((game) => (
                <Link key={game.href} className={`gameButton ${game.cls}`} href={game.href}>
                  <span className="gameEmoji">{game.emoji}</span> {game.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
