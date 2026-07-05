// ---------------------------------------------------------------------------
// WORD PICTURE — one place that turns a word into its picture.
// ---------------------------------------------------------------------------
// Most words use an emoji, but a few are hand-drawn SVGs: फल (several fruits),
// हल (an ox-drawn plough), मटर (a slim pea pod), रबर (an eraser) and पलक (an
// eye with an arrow to the eyelid). Used by both Blocks and Word Train.
// ---------------------------------------------------------------------------
import EraserIcon from "@/components/shared/EraserIcon";
import { FruitsIcon, PloughIcon, PeasIcon } from "@/components/shared/LetterPicture";

export default function WordPicture({
  id,
  emoji,
  size = 104,
  className,
}: {
  id: string;
  emoji: string;
  size?: number;
  className?: string; // used for the emoji fallback
}) {
  switch (id) {
    case "phal":
      return <FruitsIcon size={size} />;
    case "hal":
      return <PloughIcon size={size} />;
    case "matar":
      return <PeasIcon size={size} />;
    case "rabar":
      return <EraserIcon size={size} />;
    case "palak":
      return (
        <span className="palakPic">
          <span className="palakEye">👁️</span>
          <svg className="palakArrow" viewBox="0 0 100 100" aria-hidden="true">
            <path d="M86 14 L52 41" stroke="#e23b3b" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M52 41 L66 38 L60 52 Z" fill="#e23b3b" />
          </svg>
        </span>
      );
    default:
      return <span className={className}>{emoji}</span>;
  }
}
