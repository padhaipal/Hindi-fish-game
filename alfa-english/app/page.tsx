// ---------------------------------------------------------------------------
// HOME — the ALfA English games hub.
// ---------------------------------------------------------------------------
// Top: the LESSONS (1/3/5/7/9). Each lesson has its own URL (/lesson/N) for the
// book's QR codes, and plays Frog Jump then the Fish game for that lesson's
// letters. Below: all the other games. Every game/lesson has a shareable URL.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { READING_LESSONS } from "@/lib/lessons";

interface GameLink {
  href: string;
  label: string;
  emoji: string;
  cls: string;
}

const MORE_GAMES: GameLink[] = [
  { href: "/writing", label: "Writing", emoji: "✏️", cls: "gbLekhan" },
  { href: "/memory", label: "Memory", emoji: "🧠", cls: "gbMemory" },
  { href: "/blocks", label: "Blocks", emoji: "🧱", cls: "gbBlocks" },
  { href: "/train", label: "Word Train", emoji: "🚂", cls: "gbTrain" },
  { href: "/word-machine", label: "Word Machine", emoji: "🎡", cls: "gbMachine" },
  { href: "/rhyme", label: "Rhyme Time", emoji: "🎵", cls: "gbRhyme" },
  { href: "/detective", label: "Sound Detective", emoji: "🕵️", cls: "gbDetective" },
  { href: "/sentence", label: "Sentence Builder", emoji: "📝", cls: "gbSentence" },
  { href: "/silly", label: "Silly Sentences", emoji: "🤪", cls: "gbSilly" },
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

        <div className="homeGroup">
          <div className="homeGroupTitle">Lessons</div>
          <div className="homeButtons">
            {READING_LESSONS.map((l) => (
              <Link key={l.n} className="gameButton gbLesson" href={`/lesson/${l.n}`}>
                <span className="gameEmoji">🐸</span> Lesson {l.n}
                <span className="lessonBtnLetters">{l.letters.join(" ")}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="homeGroup">
          <div className="homeGroupTitle">More Games</div>
          <div className="homeButtons">
            {MORE_GAMES.map((g) => (
              <Link key={g.href} className={`gameButton ${g.cls}`} href={g.href}>
                <span className="gameEmoji">{g.emoji}</span> {g.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
