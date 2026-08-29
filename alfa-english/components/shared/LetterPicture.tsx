// ---------------------------------------------------------------------------
// LETTER PICTURE — renders a letter's ALfA picture (mostly an emoji; a custom
// drawing for the few letters where no emoji fits, e.g. t -> spinning top).
// ---------------------------------------------------------------------------
import { Letter } from "@/lib/letters";
import TopIcon from "./TopIcon";
import JamIcon from "./JamIcon";

export default function LetterPicture({
  letter,
  size = 84,
  className,
}: {
  letter: Letter;
  size?: number;
  className?: string;
}) {
  if (letter.icon === "top") return <TopIcon size={size} />;
  if (letter.icon === "jam") return <JamIcon size={size} />;
  return (
    <span className={className} style={{ fontSize: Math.round(size * 0.86), lineHeight: 1 }}>
      {letter.emoji}
    </span>
  );
}
