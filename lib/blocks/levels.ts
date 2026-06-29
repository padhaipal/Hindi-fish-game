// ---------------------------------------------------------------------------
// BLOCKS GAME — LEVELS
// ---------------------------------------------------------------------------
// 5 levels of growing grids. Each level has its own background colour and a set
// of PRE-GENERATED boards (full grid, all VERIFIED winnable: every word is a
// unique adjacent pair — horizontal or vertical — at its step). A random board
// is chosen each time a level is played. Each word appears AT MOST ONCE per
// board (no repeats).
//
//   Lvl 1: 3x2 (6 blocks, 3 words)     Lvl 4: 4x4 (16 blocks, 8 words)
//   Lvl 2: 4x2 (8 blocks, 4 words)     Lvl 5: 5x4 (20 blocks, 10 words)
//   Lvl 3: 4x3 (12 blocks, 6 words)
//
// त always appears (via तप); all 8 letters appear once the grid is >= 12 blocks.
// DO NOT hand-edit — regenerate with scripts/generate-boards.mjs.
// ---------------------------------------------------------------------------

export interface BoardData {
  cols: string[][]; // columns of letter ids, index 0 = bottom
  order: string[];  // word ids to clear, in sequence
}

export interface BlockLevel {
  cols: number;
  rows: number;
  bg: string; // CSS background for this level
  boards: BoardData[];
}

export const LEVELS: BlockLevel[] = [
  {
    cols: 3,
    rows: 2,
    bg: "linear-gradient(#e8ffe9 0%, #b8f0c0 55%, #8fe0a0 100%)",
    boards: [
      { cols: [["pa","ta"],["pa","ka"],["ba","sa"]], order: ["tap","sab","cup"] },
      { cols: [["pa","ta"],["sa","ra"],["ba","ka"]], order: ["tap","kab","ras"] },
      { cols: [["sa","ba"],["pa","ka"],["pa","ta"]], order: ["cup","bus","tap"] },
      { cols: [["pa","ta"],["sa","ka"],["ra","ba"]], order: ["sar","kab","tap"] },
      { cols: [["ba","pa"],["la","ka"],["pa","ta"]], order: ["tap","pak","bal"] },
      { cols: [["pa","ta"],["sa","ra"],["la","cha"]], order: ["tap","ras","chal"] },
      { cols: [["ra","sa"],["la","cha"],["pa","ta"]], order: ["chal","sar","tap"] },
      { cols: [["pa","ta"],["la","cha"],["ba","ka"]], order: ["chal","kab","tap"] },
      { cols: [["cha","ba"],["la","sa"],["pa","ta"]], order: ["chal","tap","bus"] },
      { cols: [["la","cha"],["ta","pa"],["pa","ra"]], order: ["par","tap","chal"] },
      { cols: [["sa","ba"],["pa","ta"],["la","ba"]], order: ["bal","tap","bus"] },
      { cols: [["sa","ba"],["pa","ta"],["cha","sa"]], order: ["sach","tap","bus"] },
      { cols: [["sa","ta"],["cha","pa"],["ba","sa"]], order: ["sab","tap","sach"] },
      { cols: [["ta","sa"],["pa","ra"],["pa","ka"]], order: ["cup","tap","sar"] },
      { cols: [["ra","sa"],["ba","sa"],["pa","ta"]], order: ["sab","tap","sar"] },
      { cols: [["ta","sa"],["pa","ba"],["sa","ba"]], order: ["sab","bus","tap"] },
      { cols: [["ta","sa"],["pa","ba"],["la","cha"]], order: ["sab","chal","tap"] },
      { cols: [["ka","pa"],["ba","ta"],["la","pa"]], order: ["bal","tap","pak"] },
      { cols: [["la","ba"],["pa","ta"],["ba","ka"]], order: ["tap","kab","bal"] },
      { cols: [["pa","ta"],["cha","sa"],["la","ba"]], order: ["sach","tap","bal"] },
    ],
  },
  {
    cols: 4,
    rows: 2,
    bg: "linear-gradient(#e9f7ff 0%, #bfe6ff 55%, #93d4f5 100%)",
    boards: [
      { cols: [["la","cha"],["ba","sa"],["ka","ta"],["pa","pa"]], order: ["sab","chal","tap","cup"] },
      { cols: [["pa","ka"],["sa","ba"],["pa","ta"],["la","ba"]], order: ["bus","cup","tap","bal"] },
      { cols: [["sa","ba"],["cha","ta"],["la","pa"],["pa","ka"]], order: ["cup","tap","chal","bus"] },
      { cols: [["la","cha"],["ka","pa"],["ka","ta"],["pa","pa"]], order: ["chal","pak","cup","tap"] },
      { cols: [["pa","ta"],["ba","ka"],["sa","cha"],["cha","la"]], order: ["sach","tap","chal","kab"] },
      { cols: [["pa","ta"],["ba","sa"],["sa","ra"],["pa","ka"]], order: ["ras","sab","cup","tap"] },
      { cols: [["ka","pa"],["pa","ta"],["la","cha"],["la","ba"]], order: ["bal","tap","pak","chal"] },
      { cols: [["pa","ta"],["pa","cha"],["ra","la"],["ba","ka"]], order: ["tap","chal","kab","par"] },
      { cols: [["ta","sa"],["pa","ra"],["pa","ka"],["la","cha"]], order: ["chal","tap","cup","sar"] },
      { cols: [["pa","ta"],["sa","ka"],["ra","pa"],["ra","pa"]], order: ["sar","cup","tap","par"] },
      { cols: [["la","ba"],["ba","sa"],["pa","ta"],["ra","sa"]], order: ["sab","bal","tap","sar"] },
      { cols: [["ta","sa"],["pa","ra"],["ba","pa"],["sa","ra"]], order: ["tap","sar","bus","par"] },
      { cols: [["ta","ka"],["pa","pa"],["pa","pa"],["ra","ka"]], order: ["pak","cup","tap","par"] },
      { cols: [["ta","sa"],["pa","cha"],["la","cha"],["ba","ka"]], order: ["kab","tap","sach","chal"] },
      { cols: [["pa","ta"],["ba","ka"],["ba","cha"],["sa","la"]], order: ["tap","chal","bus","kab"] },
      { cols: [["ra","sa"],["sa","cha"],["pa","ta"],["ba","sa"]], order: ["sab","sach","tap","ras"] },
      { cols: [["pa","ta"],["ba","ka"],["pa","ba"],["ka","la"]], order: ["tap","pak","bal","kab"] },
      { cols: [["sa","ra"],["pa","ta"],["la","ba"],["ra","sa"]], order: ["tap","sar","bal","ras"] },
      { cols: [["pa","ka"],["pa","ta"],["ba","sa"],["ra","pa"]], order: ["tap","par","cup","sab"] },
      { cols: [["pa","ta"],["ra","sa"],["cha","sa"],["ka","pa"]], order: ["sach","pak","tap","sar"] },
      { cols: [["la","cha"],["pa","ta"],["sa","ka"],["ba","ba"]], order: ["tap","kab","chal","sab"] },
      { cols: [["ba","ka"],["la","pa"],["pa","ta"],["ba","sa"]], order: ["tap","bal","sab","cup"] },
      { cols: [["ra","pa"],["sa","ta"],["cha","pa"],["sa","ra"]], order: ["sach","par","tap","ras"] },
      { cols: [["sa","cha"],["cha","la"],["pa","ta"],["la","ba"]], order: ["tap","sach","bal","chal"] },
    ],
  },
  {
    cols: 4,
    rows: 3,
    bg: "linear-gradient(#f1e9ff 0%, #d6c2ff 55%, #b79bf0 100%)",
    boards: [
      { cols: [["ra","pa","ta"],["sa","ba","cha"],["la","la","sa"],["ba","ka","ra"]], order: ["kab","tap","ras","bal","chal","sar"] },
      { cols: [["sa","ta","cha"],["ba","pa","la"],["ka","ra","sa"],["pa","cha","sa"]], order: ["tap","chal","sach","cup","sar","sab"] },
      { cols: [["la","cha","ka"],["pa","la","ba"],["sa","ra","sa"],["cha","pa","ta"]], order: ["ras","sach","tap","bal","chal","cup"] },
      { cols: [["sa","ra","ba"],["cha","ka","la"],["pa","la","ba"],["ka","pa","ta"]], order: ["ras","tap","pak","kab","chal","bal"] },
      { cols: [["ta","ba","sa"],["pa","sa","ra"],["cha","cha","sa"],["ba","ka","la"]], order: ["bus","sar","sach","kab","tap","chal"] },
      { cols: [["pa","ta","sa"],["sa","ba","ba"],["cha","ba","ka"],["ra","pa","la"]], order: ["par","chal","tap","bus","kab","sab"] },
      { cols: [["pa","ka","cha"],["la","sa","ra"],["pa","ba","ta"],["ka","sa","pa"]], order: ["pak","cup","tap","bus","ras","chal"] },
      { cols: [["ta","sa","ra"],["ka","pa","pa"],["cha","sa","ba"],["la","ba","la"]], order: ["chal","sab","bal","pak","ras","tap"] },
      { cols: [["ba","sa","ra"],["pa","ta","la"],["sa","cha","sa"],["ra","ba","ka"]], order: ["ras","tap","sach","sar","kab","bal"] },
      { cols: [["sa","pa","ka"],["ba","la","cha"],["ba","pa","ta"],["la","sa","ra"]], order: ["bal","chal","tap","cup","ras","sab"] },
      { cols: [["ta","ra","sa"],["ka","pa","pa"],["sa","la","ba"],["pa","ka","cha"]], order: ["bal","sar","cup","pak","sach","tap"] },
      { cols: [["ta","sa","ra"],["pa","la","ba"],["sa","pa","cha"],["ra","ka","la"]], order: ["bal","tap","sar","ras","pak","chal"] },
      { cols: [["ka","pa","ba"],["ta","sa","sa"],["pa","sa","ba"],["ra","la","cha"]], order: ["tap","pak","sar","bus","sab","chal"] },
      { cols: [["ta","pa","ka"],["la","ba","pa"],["ra","ra","sa"],["sa","la","cha"]], order: ["bal","ras","tap","sar","chal","cup"] },
      { cols: [["sa","cha","ba"],["ra","la","sa"],["ta","pa","ka"],["pa","ba","ka"]], order: ["sar","kab","bus","tap","cup","chal"] },
      { cols: [["ba","ba","sa"],["la","sa","ra"],["ka","pa","ta"],["pa","cha","sa"]], order: ["bus","sar","bal","tap","sach","cup"] },
      { cols: [["cha","sa","ta"],["la","ba","pa"],["ra","pa","sa"],["sa","ka","ra"]], order: ["bal","sach","ras","tap","sar","pak"] },
      { cols: [["ta","ba","ka"],["pa","ra","sa"],["cha","la","ba"],["la","ka","pa"]], order: ["pak","kab","sar","chal","tap","bal"] },
      { cols: [["sa","ba","pa"],["pa","ta","ka"],["pa","ra","ka"],["la","sa","cha"]], order: ["tap","ras","bus","pak","chal","cup"] },
      { cols: [["sa","ba","ra"],["pa","la","ka"],["sa","ba","sa"],["pa","ta","cha"]], order: ["sach","bal","cup","tap","ras","bus"] },
      { cols: [["ka","ra","pa"],["ba","cha","pa"],["sa","la","ka"],["cha","pa","ta"]], order: ["sach","par","kab","tap","pak","chal"] },
      { cols: [["pa","ta","ba"],["sa","ra","sa"],["sa","ka","pa"],["la","cha","ba"]], order: ["chal","bus","tap","ras","sab","pak"] },
      { cols: [["sa","la","ba"],["pa","sa","ra"],["ka","ka","cha"],["pa","pa","ta"]], order: ["bal","pak","tap","cup","sach","sar"] },
      { cols: [["sa","pa","ta"],["ra","ba","pa"],["ba","ka","sa"],["la","la","cha"]], order: ["chal","bal","bus","tap","sar","pak"] },
      { cols: [["la","ba","ta"],["ra","pa","pa"],["ka","cha","pa"],["sa","la","ba"]], order: ["tap","chal","bal","par","pak","bus"] },
      { cols: [["ka","pa","sa"],["pa","ta","ba"],["pa","la","ba"],["ra","cha","sa"]], order: ["par","tap","pak","sach","sab","bal"] },
      { cols: [["ka","pa","cha"],["la","ra","pa"],["ba","ka","ta"],["ba","sa","pa"]], order: ["kab","pak","sab","chal","par","tap"] },
      { cols: [["pa","ba","ta"],["sa","sa","ra"],["sa","ka","pa"],["ba","la","cha"]], order: ["sab","chal","pak","bus","ras","tap"] },
    ],
  },
  {
    cols: 4,
    rows: 4,
    bg: "linear-gradient(#fff0db 0%, #ffd9a8 55%, #ffc078 100%)",
    boards: [
      { cols: [["cha","sa","ba","ka"],["ra","ta","ka","pa"],["sa","pa","ra","sa"],["pa","la","cha","ka"]], order: ["tap","pak","chal","sach","sar","ras","kab","cup"] },
      { cols: [["cha","ka","ba","ka"],["la","pa","pa","ta"],["pa","ba","ra","sa"],["ra","la","cha","sa"]], order: ["sach","tap","sar","par","kab","cup","bal","chal"] },
      { cols: [["pa","ta","la","cha"],["sa","ra","ra","sa"],["ka","ba","ka","pa"],["ra","pa","la","ba"]], order: ["tap","par","kab","bal","ras","chal","sar","pak"] },
      { cols: [["ba","ka","ba","sa"],["ra","ta","la","ba"],["sa","sa","pa","ba"],["ra","la","sa","cha"]], order: ["ras","sar","bal","kab","sab","bus","tap","chal"] },
      { cols: [["ka","pa","ra","sa"],["pa","ta","cha","ka"],["la","ba","la","ba"],["sa","ra","cha","sa"]], order: ["sach","chal","sar","ras","kab","pak","bal","tap"] },
      { cols: [["ra","pa","la","cha"],["ba","cha","sa","ka"],["ka","ba","pa","ta"],["pa","sa","ra","sa"]], order: ["chal","tap","bus","cup","sar","sach","par","kab"] },
      { cols: [["pa","ka","cha","sa"],["sa","la","cha","ra"],["ba","pa","ta","ba"],["ra","sa","la","sa"]], order: ["bus","tap","sach","sar","cup","chal","bal","ras"] },
      { cols: [["ka","la","ba","ba"],["ba","sa","pa","sa"],["pa","ta","pa","ra"],["ka","la","cha","sa"]], order: ["tap","bal","chal","pak","ras","sab","bus","cup"] },
      { cols: [["pa","ta","sa","ra"],["la","sa","cha","ba"],["sa","ba","la","cha"],["pa","ba","ka","ka"]], order: ["bus","kab","tap","sach","cup","ras","chal","bal"] },
      { cols: [["cha","ba","ra","sa"],["la","ba","sa","la"],["ra","pa","pa","ka"],["ka","pa","ta","pa"]], order: ["sab","sar","tap","cup","bal","chal","par","pak"] },
      { cols: [["cha","la","ba","sa"],["sa","sa","ra","ba"],["ra","pa","ba","sa"],["ba","pa","ta","ka"]], order: ["bus","tap","bal","ras","par","kab","sab","sach"] },
      { cols: [["pa","sa","pa","ta"],["ka","ra","ba","sa"],["ra","cha","pa","ka"],["ba","la","la","ba"]], order: ["bal","sab","sar","pak","tap","chal","par","kab"] },
      { cols: [["sa","ra","pa","ra"],["pa","ba","cha","sa"],["pa","ta","ka","sa"],["la","ba","sa","cha"]], order: ["sab","tap","chal","par","bus","sach","pak","ras"] },
      { cols: [["cha","sa","ta","cha"],["pa","la","ka","pa"],["ba","sa","sa","ba"],["ra","sa","ra","pa"]], order: ["ras","sab","par","sach","pak","bus","chal","tap"] },
      { cols: [["ra","sa","pa","ka"],["pa","ta","pa","ra"],["sa","ka","sa","sa"],["ba","la","cha","cha"]], order: ["ras","sab","tap","cup","sar","sach","pak","chal"] },
      { cols: [["ba","pa","ka","sa"],["ra","pa","ba","ka"],["sa","cha","pa","ta"],["cha","ka","pa","la"]], order: ["cup","par","pak","kab","tap","sab","chal","sach"] },
      { cols: [["la","ka","pa","cha"],["ra","sa","sa","ra"],["ra","pa","pa","ta"],["ba","la","ba","ka"]], order: ["sar","pak","par","tap","chal","bal","kab","ras"] },
      { cols: [["la","ba","sa","ra"],["cha","sa","pa","cha"],["ta","ka","la","ka"],["ba","ka","pa","pa"]], order: ["ras","sach","bal","kab","cup","chal","tap","pak"] },
      { cols: [["pa","ta","ka","sa"],["ba","pa","ka","ra"],["sa","ra","cha","sa"],["la","ba","sa","ba"]], order: ["cup","sach","sab","tap","sar","ras","kab","bal"] },
      { cols: [["ka","pa","ra","sa"],["sa","pa","ra","ta"],["ba","ba","sa","ka"],["la","pa","ka","cha"]], order: ["sar","pak","ras","cup","chal","kab","sab","tap"] },
      { cols: [["sa","ra","ra","sa"],["cha","pa","ta","sa"],["sa","sa","ba","ba"],["ba","la","ka","pa"]], order: ["sach","pak","tap","bus","ras","sar","bal","sab"] },
      { cols: [["ka","ba","la","cha"],["sa","ba","pa","la"],["pa","ba","ka","ta"],["ra","ra","sa","pa"]], order: ["pak","par","sar","chal","sab","bal","tap","kab"] },
      { cols: [["sa","ba","ba","sa"],["pa","pa","cha","la"],["ra","pa","ta","ka"],["sa","ra","ra","sa"]], order: ["bus","tap","sar","par","sach","pak","ras","bal"] },
      { cols: [["sa","ba","ka","ba"],["sa","ra","ba","sa"],["pa","ta","cha","sa"],["la","la","ba","cha"]], order: ["bal","sab","ras","kab","sach","bus","chal","tap"] },
      { cols: [["pa","sa","la","ba"],["ka","ba","la","cha"],["sa","pa","ta","ka"],["cha","ra","sa","ba"]], order: ["sach","pak","sar","chal","bal","sab","tap","kab"] },
      { cols: [["sa","pa","ta","ba"],["pa","ka","ka","pa"],["ba","ka","la","cha"],["ra","pa","cha","sa"]], order: ["sach","kab","tap","cup","pak","par","chal","bus"] },
      { cols: [["pa","ta","ba","sa"],["sa","la","pa","ra"],["cha","ba","ra","ka"],["sa","pa","ka","ra"]], order: ["par","kab","tap","cup","sach","ras","bal","sar"] },
      { cols: [["sa","ka","la","cha"],["ra","ba","ta","pa"],["sa","ba","pa","ka"],["cha","la","pa","ka"]], order: ["tap","sach","sar","pak","bal","cup","kab","chal"] },
      { cols: [["ba","sa","la","ba"],["cha","ka","pa","ka"],["la","pa","pa","ta"],["ra","pa","ba","ka"]], order: ["kab","pak","cup","sab","par","tap","chal","bal"] },
      { cols: [["pa","ta","la","cha"],["ba","sa","sa","ba"],["la","cha","ra","sa"],["pa","sa","ra","ka"]], order: ["tap","ras","sach","chal","cup","sab","sar","bal"] },
    ],
  },
  {
    cols: 5,
    rows: 4,
    bg: "linear-gradient(#ffe9f3 0%, #ffc2dd 55%, #ff9bc0 100%)",
    boards: [
      { cols: [["pa","sa","ba","ka"],["ra","ra","ba","ta"],["la","sa","ba","pa"],["pa","pa","ka","sa"],["ka","ba","la","cha"]], order: ["pak","par","chal","kab","cup","sar","bus","bal","sab","tap"] },
      { cols: [["sa","ra","ra","pa"],["sa","ba","ba","ka"],["pa","ka","pa","ta"],["la","cha","sa","pa"],["cha","ka","ba","sa"]], order: ["ras","par","cup","bus","chal","kab","sab","pak","tap","sach"] },
      { cols: [["ba","ka","sa","ba"],["la","ba","sa","pa"],["pa","ta","ba","ka"],["cha","ra","sa","sa"],["ra","pa","la","cha"]], order: ["chal","tap","sab","par","cup","bus","bal","sar","kab","sach"] },
      { cols: [["sa","ra","la","cha"],["ra","sa","pa","sa"],["sa","ba","ka","cha"],["pa","ta","ka","ka"],["la","ba","ba","pa"]], order: ["bus","tap","chal","kab","bal","sach","sar","pak","cup","ras"] },
      { cols: [["cha","ba","ka","sa"],["ka","sa","ba","ta"],["sa","pa","pa","pa"],["ba","ka","ra","sa"],["ra","la","ba","pa"]], order: ["tap","pak","bal","sab","cup","bus","kab","sach","par","sar"] },
      { cols: [["sa","sa","ba","sa"],["ra","ba","ba","ka"],["ka","pa","cha","sa"],["ka","ra","pa","ta"],["pa","pa","la","cha"]], order: ["sach","cup","sar","kab","chal","par","tap","pak","bus","sab"] },
      { cols: [["ka","la","cha","ba"],["ba","la","ka","sa"],["pa","cha","ba","sa"],["sa","ba","pa","ta"],["ra","ra","pa","sa"]], order: ["chal","bus","sab","tap","kab","bal","cup","sach","par","sar"] },
      { cols: [["la","ba","ba","ka"],["sa","ra","sa","ka"],["ra","pa","pa","ta"],["sa","cha","sa","ba"],["ra","pa","ba","sa"]], order: ["kab","tap","sach","bal","bus","sab","ras","cup","par","sar"] },
      { cols: [["ra","ba","ka","sa"],["sa","ra","pa","ba"],["ra","cha","pa","sa"],["sa","pa","ka","ta"],["ba","la","ba","sa"]], order: ["par","bus","bal","pak","tap","ras","sab","sach","kab","sar"] },
      { cols: [["ra","ka","pa","sa"],["la","cha","ra","pa"],["sa","ra","ba","sa"],["pa","ba","ta","ka"],["pa","sa","ba","ka"]], order: ["kab","pak","bus","ras","chal","tap","cup","sab","par","sar"] },
      { cols: [["ra","pa","ka","ba"],["pa","la","ka","pa"],["ba","ka","sa","sa"],["cha","pa","ta","ba"],["ra","sa","ra","sa"]], order: ["sab","tap","kab","par","sach","ras","pak","cup","bal","sar"] },
      { cols: [["ra","sa","pa","sa"],["ba","ba","ka","ka"],["sa","ba","ra","pa"],["pa","ka","la","cha"],["pa","ta","sa","ra"]], order: ["ras","chal","par","tap","pak","kab","cup","sar","sab","bus"] },
      { cols: [["ra","sa","ka","pa"],["cha","sa","la","ba"],["ra","pa","pa","ka"],["ba","cha","sa","ba"],["sa","la","pa","ta"]], order: ["chal","cup","par","sar","tap","sab","sach","bus","pak","bal"] },
      { cols: [["cha","sa","ba","sa"],["ra","ra","sa","ta"],["sa","ka","cha","pa"],["pa","pa","ba","la"],["ra","la","sa","ba"]], order: ["tap","sab","par","ras","sar","sach","cup","bus","bal","chal"] },
      { cols: [["ba","la","ba","sa"],["pa","cha","ka","ta"],["pa","la","pa","sa"],["sa","cha","ba","ka"],["ba","sa","ra","ka"]], order: ["ras","bal","cup","chal","sach","bus","tap","sab","pak","kab"] },
      { cols: [["pa","ka","ba","sa"],["cha","sa","ra","ta"],["ra","pa","la","pa"],["ka","ba","ka","pa"],["ba","sa","la","ba"]], order: ["pak","bal","bus","sab","tap","par","ras","cup","kab","chal"] },
      { cols: [["pa","sa","ra","ka"],["ba","ba","ta","sa"],["la","ka","pa","sa"],["ba","cha","sa","ba"],["ka","pa","la","cha"]], order: ["tap","chal","bal","bus","sab","sach","pak","ras","kab","cup"] },
      { cols: [["ba","sa","ra","ka"],["pa","la","cha","ba"],["ka","sa","ba","la"],["sa","sa","ta","pa"],["ba","cha","pa","ra"]], order: ["sach","bal","pak","chal","ras","kab","bus","par","tap","sab"] },
      { cols: [["ba","cha","sa","sa"],["pa","pa","ta","ka"],["ba","ba","ra","pa"],["ra","sa","ka","la"],["sa","ba","la","cha"]], order: ["par","ras","bus","kab","tap","sach","sab","cup","chal","bal"] },
      { cols: [["cha","pa","ba","ka"],["la","ba","ba","ka"],["sa","la","sa","ra"],["pa","ta","sa","pa"],["ba","sa","cha","ra"]], order: ["sach","sab","ras","tap","chal","bal","par","bus","pak","kab"] },
      { cols: [["sa","ra","pa","ta"],["la","cha","sa","ka"],["cha","ba","sa","ba"],["sa","ra","pa","ka"],["ba","sa","ka","pa"]], order: ["chal","kab","sar","tap","cup","pak","ras","sach","bus","sab"] },
      { cols: [["cha","ba","sa","sa"],["pa","pa","ka","ba"],["ra","sa","ka","sa"],["pa","ba","ta","ka"],["ra","la","pa","ba"]], order: ["bus","sar","pak","par","sab","kab","tap","sach","bal","cup"] },
      { cols: [["sa","sa","pa","ba"],["ta","ba","ra","ra"],["pa","pa","ka","sa"],["ka","pa","la","ba"],["cha","sa","ra","sa"]], order: ["par","bal","sab","bus","sach","sar","cup","tap","pak","ras"] },
      { cols: [["ra","ka","ka","pa"],["ba","ta","sa","pa"],["ra","pa","sa","pa"],["sa","ba","ka","ba"],["ra","la","la","cha"]], order: ["sar","chal","kab","bal","par","bus","pak","tap","cup","ras"] },
      { cols: [["sa","ba","cha","sa"],["pa","ta","ka","pa"],["ra","sa","sa","ra"],["ba","la","cha","ka"],["ra","pa","ba","sa"]], order: ["chal","sach","sar","ras","tap","par","sab","pak","bus","kab"] },
      { cols: [["ta","la","ba","ka"],["pa","ra","pa","pa"],["sa","la","cha","sa"],["ra","ka","ba","ba"],["ba","sa","sa","ra"]], order: ["bus","tap","par","chal","ras","bal","sar","cup","kab","sab"] },
      { cols: [["ra","pa","la","cha"],["sa","ba","sa","ba"],["ka","ra","sa","pa"],["sa","pa","ka","ka"],["cha","pa","ta","ba"]], order: ["cup","sach","chal","sab","tap","sar","kab","par","pak","bus"] },
      { cols: [["cha","sa","pa","ta"],["ba","sa","ka","pa"],["ra","ra","pa","ba"],["sa","sa","ra","sa"],["ba","ka","la","cha"]], order: ["kab","chal","sach","tap","cup","sab","par","bus","sar","ras"] },
      { cols: [["cha","la","ba","ka"],["la","cha","sa","pa"],["ra","sa","ka","pa"],["ra","pa","ra","ta"],["sa","pa","sa","ba"]], order: ["cup","bal","bus","pak","sar","sach","par","ras","chal","tap"] },
      { cols: [["sa","ra","ba","sa"],["ka","sa","pa","cha"],["pa","la","cha","ra"],["sa","pa","ta","ba"],["ra","ba","sa","la"]], order: ["sach","tap","cup","sar","chal","sab","bal","ras","bus","par"] },
    ],
  },
];
