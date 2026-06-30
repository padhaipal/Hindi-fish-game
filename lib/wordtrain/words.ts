// ---------------------------------------------------------------------------
// WORD TRAIN — WORD LIST
// ---------------------------------------------------------------------------
// Each word has a picture (emoji), a spoken-word audio, and its letters in
// order. The learner drags letter "coaches" onto the track to spell the word.
//
// We start with the 12 two-letter words (reused from the Blocks game — they
// already have pictures + audio). Longer 3- and 4-letter words (e.g. कसरत) can
// be added here once their audio is recorded; the game handles any length.
// ---------------------------------------------------------------------------

import { BLOCK_WORDS, BlockWord } from "@/lib/blocks/words";

export type TrainWord = BlockWord; // { id, word, letters, emoji, audio, label }

// 2-letter words (audio in /public/audio/words). Longer words go here later.
export const TRAIN_WORDS: TrainWord[] = BLOCK_WORDS;

// How many words make up one play session.
export const SESSION_LENGTH = 5;
