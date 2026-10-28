// Per-letter content: the picture word that starts with the letter's sound,
// and whichever recordings exist. A missing recording falls back to the
// phone's text-to-speech, so a letter only needs `char` and `pictureName` to
// work. Recordings ship in public/media (copied from this repo's games:
// public/audio/letters, letters-word, pictures and public/videos).
export interface LetterMedia {
  char: string;
  pictureName: string;
  // Key into PICTURES (Picture.tsx).
  picture: string;
  letterAudio?: string; // the letter's sound: "ब"
  pictureAudio?: string; // the picture's name: "बत्तख़"
  pictureLetterAudio?: string; // picture then letter: "बत्तख़ … ब"
  pictureLetterVideo?: string; // the picture turning into the letter
}

export const LETTER_MEDIA: Record<string, LetterMedia> = {
  अ: {
    char: "अ",
    pictureName: "अनार",
    picture: "anaar",
  },
  ब: {
    char: "ब",
    pictureName: "बतख",
    picture: "batakh",
    letterAudio: "media/audio/letter-ba.mp3",
    pictureAudio: "media/audio/picture-ba.mp3",
    pictureLetterAudio: "media/audio/picture-letter-ba.mp3",
    pictureLetterVideo: "media/video/picture-letter-ba.mp4",
  },
};

export function letterMedia(char: string): LetterMedia {
  return LETTER_MEDIA[char] ?? { char, pictureName: char, picture: "" };
}
