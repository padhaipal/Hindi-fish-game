import { useEffect, useState } from "react";
import type { Visual } from "../media/manifest";
import { letterMedia } from "../media/letters";
import { Picture } from "../media/Picture";

// The big card in the middle of the lesson: the word, the letter, the
// picture, or the picture-letter card (its video first, when there is one).
export function VisualCard({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case "word":
      return <div className="card word-card">{visual.text}</div>;
    case "letter":
      return <div className="card letter-card">{visual.char}</div>;
    case "picture":
      return (
        <div className="card picture-card">
          <Picture name={letterMedia(visual.char).picture} />
        </div>
      );
    case "pictureLetter":
      return <PictureLetter char={visual.char} />;
    case "sticker":
      return <div className="card sticker">{visual.emoji}</div>;
  }
}

function PictureLetter({ char }: { char: string }) {
  const m = letterMedia(char);
  const [videoDone, setVideoDone] = useState(!m.pictureLetterVideo);
  useEffect(() => setVideoDone(!m.pictureLetterVideo), [char, m.pictureLetterVideo]);

  if (!videoDone && m.pictureLetterVideo) {
    return (
      <div className="card picture-letter-card">
        <video
          src={m.pictureLetterVideo}
          autoPlay
          muted
          playsInline
          onEnded={() => setVideoDone(true)}
          onError={() => setVideoDone(true)}
        />
      </div>
    );
  }
  return (
    <button
      className="card picture-letter-card"
      onClick={() => m.pictureLetterVideo && setVideoDone(false)}
      aria-label={m.pictureLetterVideo ? "वीडियो फिर से चलाएँ" : undefined}
    >
      <div className="pl-picture">
        <Picture name={m.picture} />
      </div>
      <div className="pl-letter">{char}</div>
    </button>
  );
}
