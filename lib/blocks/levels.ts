// ---------------------------------------------------------------------------
// BLOCKS GAME — LEVELS
// ---------------------------------------------------------------------------
// 5 levels of growing grids. Each level has its own background colour and a set
// of PRE-GENERATED boards (full grid, all VERIFIED winnable: every word is a
// unique adjacent pair — horizontal or vertical — at its step). A random board
// is chosen each time a level is played.
//
//   Lvl 1: 3x2 (6 blocks, 3 words)     Lvl 4: 4x4 (16 blocks, 8 words)
//   Lvl 2: 4x2 (8 blocks, 4 words)     Lvl 5: 5x4 (20 blocks, 10 words)
//   Lvl 3: 4x3 (12 blocks, 6 words)
//
// त always appears (via तप); all 8 letters appear once the grid is big enough
// (>= 12 blocks). DO NOT hand-edit — regenerate with scripts/generate-boards.mjs.
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
      { cols: [["sa","ra"],["pa","ta"],["cha","sa"]], order: ["sach","ras","tap"] },
      { cols: [["ta","ra"],["pa","sa"],["pa","ka"]], order: ["tap","ras","cup"] },
      { cols: [["ka","pa"],["pa","ta"],["ra","sa"]], order: ["pak","sar","tap"] },
      { cols: [["la","cha"],["sa","ra"],["pa","ta"]], order: ["chal","ras","tap"] },
      { cols: [["cha","sa"],["pa","ta"],["la","cha"]], order: ["chal","sach","tap"] },
      { cols: [["pa","ta"],["cha","sa"],["sa","ra"]], order: ["ras","tap","sach"] },
      { cols: [["sa","ta"],["ra","pa"],["sa","ba"]], order: ["tap","sar","bus"] },
      { cols: [["sa","sa"],["ba","cha"],["pa","ta"]], order: ["tap","sab","sach"] },
      { cols: [["pa","ka"],["ta","ba"],["pa","sa"]], order: ["tap","bus","cup"] },
      { cols: [["la","ba"],["ra","sa"],["pa","ta"]], order: ["sar","bal","tap"] },
      { cols: [["ka","pa"],["ta","ba"],["pa","sa"]], order: ["tap","pak","bus"] },
      { cols: [["sa","ra"],["pa","ta"],["pa","ka"]], order: ["ras","tap","cup"] },
      { cols: [["pa","ka"],["pa","ta"],["la","ba"]], order: ["cup","bal","tap"] },
      { cols: [["ba","ta"],["la","pa"],["sa","ba"]], order: ["tap","bal","bus"] },
      { cols: [["la","cha"],["ra","pa"],["pa","ta"]], order: ["chal","tap","par"] },
      { cols: [["sa","ba"],["pa","ka"],["pa","ta"]], order: ["tap","cup","bus"] },
      { cols: [["sa","ba"],["pa","ta"],["cha","sa"]], order: ["sach","bus","tap"] },
      { cols: [["pa","ka"],["ta","sa"],["pa","ba"]], order: ["cup","sab","tap"] },
      { cols: [["ba","ka"],["pa","ta"],["sa","ba"]], order: ["tap","bus","kab"] },
      { cols: [["pa","ta"],["sa","ka"],["cha","pa"]], order: ["sach","tap","cup"] },
    ],
  },
  {
    cols: 4,
    rows: 2,
    bg: "linear-gradient(#e9f7ff 0%, #bfe6ff 55%, #93d4f5 100%)",
    boards: [
      { cols: [["sa","ra"],["ta","cha"],["pa","la"],["cha","sa"]], order: ["chal","tap","ras","sach"] },
      { cols: [["la","cha"],["sa","ra"],["ra","pa"],["pa","ta"]], order: ["ras","par","tap","chal"] },
      { cols: [["ra","pa"],["sa","ta"],["ra","pa"],["sa","ra"]], order: ["tap","sar","par","ras"] },
      { cols: [["ta","cha"],["pa","la"],["ra","pa"],["cha","sa"]], order: ["tap","par","chal","sach"] },
      { cols: [["sa","sa"],["ra","cha"],["pa","ka"],["pa","ta"]], order: ["sar","cup","sach","tap"] },
      { cols: [["pa","ta"],["ba","sa"],["cha","sa"],["sa","ra"]], order: ["sach","tap","sab","ras"] },
      { cols: [["ra","sa"],["ba","pa"],["la","ra"],["pa","ta"]], order: ["tap","par","bal","sar"] },
      { cols: [["ba","ka"],["pa","ta"],["sa","ra"],["sa","ba"]], order: ["ras","tap","kab","bus"] },
      { cols: [["pa","ta"],["cha","sa"],["ka","ba"],["pa","sa"]], order: ["sach","bus","cup","tap"] },
      { cols: [["pa","ta"],["sa","ba"],["cha","la"],["ra","pa"]], order: ["tap","par","bal","sach"] },
      { cols: [["sa","ra"],["sa","ba"],["ta","cha"],["pa","la"]], order: ["tap","bus","chal","ras"] },
      { cols: [["pa","ta"],["ra","sa"],["la","cha"],["ba","ka"]], order: ["kab","sar","chal","tap"] },
      { cols: [["ta","pa"],["pa","ka"],["sa","ra"],["la","ba"]], order: ["bal","tap","pak","ras"] },
      { cols: [["ba","sa"],["pa","ta"],["pa","ka"],["ba","ka"]], order: ["kab","sab","tap","cup"] },
      { cols: [["ka","ra"],["pa","sa"],["ra","sa"],["pa","ta"]], order: ["tap","ras","sar","cup"] },
      { cols: [["ra","pa"],["ba","ka"],["la","cha"],["pa","ta"]], order: ["kab","tap","chal","par"] },
      { cols: [["ba","ta"],["la","pa"],["ra","sa"],["ba","sa"]], order: ["bal","tap","sar","sab"] },
      { cols: [["la","cha"],["ka","ta"],["pa","pa"],["ba","sa"]], order: ["cup","tap","sab","chal"] },
      { cols: [["pa","ta"],["sa","ra"],["pa","ka"],["la","cha"]], order: ["ras","chal","cup","tap"] },
      { cols: [["pa","ta"],["sa","ba"],["pa","ka"],["la","ba"]], order: ["tap","bus","cup","bal"] },
      { cols: [["sa","ra"],["ka","ta"],["pa","pa"],["ra","sa"]], order: ["sar","cup","ras","tap"] },
      { cols: [["ba","ka"],["sa","pa"],["pa","ta"],["ba","sa"]], order: ["cup","tap","bus","sab"] },
      { cols: [["ta","sa"],["pa","ba"],["ra","pa"],["ka","pa"]], order: ["sab","pak","tap","par"] },
      { cols: [["ba","sa"],["pa","pa"],["ka","ra"],["pa","ta"]], order: ["sab","tap","par","pak"] },
    ],
  },
  {
    cols: 4,
    rows: 3,
    bg: "linear-gradient(#f1e9ff 0%, #d6c2ff 55%, #b79bf0 100%)",
    boards: [
      { cols: [["la","cha","ta"],["pa","ka","sa"],["pa","cha","pa"],["sa","ba","ra"]], order: ["bus","chal","tap","sach","par","cup"] },
      { cols: [["sa","cha","sa"],["ba","ka","pa"],["ra","pa","ba"],["pa","ta","la"]], order: ["sach","tap","sab","pak","par","bal"] },
      { cols: [["ra","pa","ka"],["ba","ta","pa"],["ka","cha","pa"],["cha","la","sa"]], order: ["chal","sach","par","tap","kab","pak"] },
      { cols: [["ka","pa","ba"],["sa","sa","ra"],["cha","ba","sa"],["pa","ta","la"]], order: ["tap","sach","pak","bal","bus","ras"] },
      { cols: [["la","cha","ba"],["ba","sa","la"],["pa","pa","ta"],["ra","pa","ka"]], order: ["tap","bal","sab","cup","par","chal"] },
      { cols: [["ra","pa","ka"],["sa","pa","ta"],["sa","la","cha"],["la","ba","ba"]], order: ["cup","chal","bal","sab","ras","tap"] },
      { cols: [["sa","la","cha"],["pa","ta","ba"],["ka","ba","sa"],["sa","ra","pa"]], order: ["ras","chal","sab","cup","tap","sab"] },
      { cols: [["ta","la","cha"],["pa","ka","pa"],["ra","ba","pa"],["sa","sa","ra"]], order: ["tap","chal","par","pak","ras","bus"] },
      { cols: [["pa","ba","ra"],["ka","sa","sa"],["ka","pa","ta"],["la","cha","pa"]], order: ["ras","chal","cup","bus","tap","pak"] },
      { cols: [["ra","pa","pa"],["sa","ba","ka"],["la","cha","sa"],["ba","pa","ta"]], order: ["bus","tap","chal","par","sab","pak"] },
      { cols: [["pa","ta","sa"],["ba","ka","pa"],["ra","pa","cha"],["pa","ka","la"]], order: ["tap","chal","par","sab","pak","cup"] },
      { cols: [["ba","la","cha"],["pa","ta","sa"],["ka","ra","pa"],["ba","ra","sa"]], order: ["sar","chal","par","tap","bus","kab"] },
      { cols: [["pa","ra","ta"],["la","sa","cha"],["ba","ka","sa"],["la","pa","ba"]], order: ["ras","sab","cup","bal","tap","chal"] },
      { cols: [["ta","ra","pa"],["pa","ba","ka"],["pa","ka","sa"],["la","cha","ba"]], order: ["chal","kab","tap","par","cup","sab"] },
      { cols: [["ra","sa","ra"],["la","cha","sa"],["pa","ka","ka"],["pa","ta","ba"]], order: ["tap","chal","sar","cup","kab","ras"] },
      { cols: [["ba","sa","pa"],["ka","sa","ra"],["ba","ta","ba"],["pa","la","cha"]], order: ["par","sab","kab","chal","tap","sab"] },
      { cols: [["ta","pa","ra"],["pa","ra","sa"],["pa","la","cha"],["ba","ka","ka"]], order: ["kab","ras","tap","pak","par","chal"] },
      { cols: [["ba","sa","ka"],["la","cha","pa"],["ta","sa","ba"],["pa","sa","ra"]], order: ["cup","ras","bal","bus","tap","sach"] },
      { cols: [["la","ba","ra"],["sa","sa","ta"],["cha","pa","cha"],["ka","la","pa"]], order: ["sach","bal","chal","ras","tap","pak"] },
      { cols: [["ba","la","cha"],["sa","ra","la"],["ka","pa","pa"],["ra","pa","ta"]], order: ["pak","tap","par","ras","chal","bal"] },
      { cols: [["ka","la","cha"],["ba","ka","pa"],["ta","ra","ba"],["pa","sa","la"]], order: ["tap","pak","ras","bal","kab","chal"] },
      { cols: [["ra","ka","sa"],["ta","ba","cha"],["ba","pa","la"],["sa","sa","ra"]], order: ["chal","kab","ras","bus","tap","sar"] },
      { cols: [["cha","pa","ka"],["ta","la","sa"],["pa","pa","ba"],["ba","sa","ra"]], order: ["cup","tap","chal","sab","par","sab"] },
      { cols: [["ba","sa","ta"],["ba","ka","pa"],["pa","ka","sa"],["la","cha","ra"]], order: ["cup","chal","sar","kab","sab","tap"] },
      { cols: [["sa","ba","sa"],["ra","la","cha"],["ka","sa","ra"],["pa","ta","ba"]], order: ["tap","sab","ras","sar","kab","chal"] },
      { cols: [["sa","ba","ra"],["la","la","cha"],["sa","ra","ta"],["ba","ka","pa"]], order: ["ras","kab","bal","chal","ras","tap"] },
      { cols: [["cha","ra","pa"],["pa","ka","la"],["sa","pa","ta"],["la","cha","ba"]], order: ["tap","chal","par","sab","cup","chal"] },
      { cols: [["sa","la","cha"],["ra","pa","ta"],["ka","ba","sa"],["ka","pa","pa"]], order: ["pak","sar","chal","sab","tap","cup"] },
    ],
  },
  {
    cols: 4,
    rows: 4,
    bg: "linear-gradient(#fff0db 0%, #ffd9a8 55%, #ffc078 100%)",
    boards: [
      { cols: [["ra","la","sa","cha"],["sa","la","ba","ba"],["pa","la","cha","ka"],["cha","sa","pa","ta"]], order: ["ras","chal","sab","sach","bal","tap","chal","cup"] },
      { cols: [["pa","cha","pa","ka"],["ka","la","sa","ra"],["ra","sa","ba","pa"],["pa","ta","la","ka"]], order: ["chal","cup","bal","sar","ras","pak","tap","pak"] },
      { cols: [["ta","sa","ra","sa"],["sa","ba","ra","pa"],["cha","la","ra","pa"],["sa","ba","pa","ka"]], order: ["sar","sach","sar","cup","bal","tap","bus","par"] },
      { cols: [["pa","ra","sa","ba"],["sa","sa","la","ka"],["cha","ra","cha","ta"],["sa","ba","ka","pa"]], order: ["tap","kab","sach","ras","sar","bal","sach","pak"] },
      { cols: [["sa","ra","cha","sa"],["ka","ta","ra","pa"],["pa","pa","pa","sa"],["ra","la","ka","ba"]], order: ["sach","pak","tap","cup","bal","par","ras","sar"] },
      { cols: [["la","ba","ba","sa"],["sa","ta","pa","ra"],["sa","ra","ka","pa"],["la","cha","sa","cha"]], order: ["ras","tap","bal","bus","sach","pak","chal","sar"] },
      { cols: [["sa","la","cha","ba"],["ta","pa","ka","sa"],["pa","ra","cha","ba"],["sa","ba","ka","la"]], order: ["tap","chal","cup","ras","sach","kab","bal","bus"] },
      { cols: [["cha","cha","sa","sa"],["ta","ka","ra","pa"],["pa","ba","cha","sa"],["pa","la","ba","ka"]], order: ["tap","sab","chal","kab","par","cup","sach","sach"] },
      { cols: [["ka","cha","sa","ra"],["sa","ba","la","pa"],["ba","ka","pa","ra"],["ra","sa","pa","ta"]], order: ["ras","sab","tap","kab","sar","pak","chal","par"] },
      { cols: [["ba","la","ta","cha"],["la","sa","sa","pa"],["cha","cha","pa","ka"],["sa","ra","sa","ra"]], order: ["sar","sach","ras","cup","tap","chal","bal","sach"] },
      { cols: [["ba","sa","pa","ka"],["la","pa","ta","cha"],["ka","pa","ra","sa"],["ra","pa","sa","ka"]], order: ["sab","tap","chal","cup","ras","cup","pak","sar"] },
      { cols: [["pa","sa","ra","sa"],["ra","ba","pa","ka"],["ka","pa","pa","ta"],["sa","ba","la","cha"]], order: ["par","tap","bus","chal","sar","pak","cup","sab"] },
      { cols: [["cha","sa","sa","ra"],["cha","ka","ta","sa"],["ba","pa","ka","pa"],["la","ra","pa","cha"]], order: ["sach","pak","sach","tap","kab","ras","par","chal"] },
      { cols: [["cha","ra","ta","sa"],["la","ka","pa","pa"],["la","ba","ra","sa"],["ba","ba","sa","sa"]], order: ["chal","sab","sar","sab","tap","bal","pak","sar"] },
      { cols: [["ba","la","cha","pa"],["sa","ra","sa","sa"],["la","ba","cha","ba"],["ba","pa","ta","ka"]], order: ["chal","sab","bus","par","bal","sach","tap","kab"] },
      { cols: [["cha","sa","ra","ta"],["pa","pa","cha","sa"],["ra","pa","la","ka"],["ba","ka","ra","sa"]], order: ["kab","chal","sach","tap","sar","cup","par","ras"] },
      { cols: [["sa","sa","ba","ta"],["cha","pa","ba","ka"],["ba","ka","ba","sa"],["la","pa","sa","ra"]], order: ["ras","cup","kab","sach","bal","sab","bus","tap"] },
      { cols: [["ka","ka","sa","ra"],["ba","sa","ta","pa"],["pa","ra","pa","ba"],["ka","sa","la","cha"]], order: ["pak","chal","kab","sar","ras","tap","cup","bus"] },
      { cols: [["ra","ka","sa","sa"],["sa","pa","ba","ra"],["cha","la","sa","ta"],["ba","la","ba","pa"]], order: ["tap","sar","bal","cup","sar","sach","bal","sab"] },
      { cols: [["la","cha","ba","sa"],["ka","ba","ta","pa"],["ba","sa","pa","sa"],["la","cha","sa","ra"]], order: ["tap","bus","pak","bal","chal","sab","ras","sach"] },
      { cols: [["la","ba","la","cha"],["ra","sa","cha","pa"],["ka","ta","la","ra"],["ba","pa","sa","ra"]], order: ["kab","bal","chal","sar","ras","tap","par","chal"] },
      { cols: [["la","cha","sa","ba"],["ba","sa","pa","ta"],["ka","ba","ra","sa"],["pa","la","la","cha"]], order: ["tap","bal","sab","sar","cup","sach","bal","chal"] },
      { cols: [["pa","cha","sa","ka"],["ba","pa","sa","ra"],["la","ka","pa","ta"],["ra","la","cha","sa"]], order: ["bal","ras","chal","tap","sach","cup","sar","pak"] },
      { cols: [["sa","ra","pa","ba"],["sa","pa","la","ba"],["cha","sa","ba","ka"],["la","cha","pa","ta"]], order: ["bus","par","pak","sach","tap","bal","bus","chal"] },
      { cols: [["la","cha","ka","ba"],["ra","sa","sa","pa"],["sa","pa","cha","ta"],["la","ba","pa","ka"]], order: ["sach","chal","cup","bal","tap","bus","ras","cup"] },
      { cols: [["sa","ba","ka","sa"],["cha","ba","pa","ba"],["ra","ta","sa","ka"],["la","pa","cha","sa"]], order: ["kab","sab","bus","tap","chal","pak","ras","sach"] },
      { cols: [["cha","ba","sa","sa"],["ta","ka","pa","cha"],["pa","la","la","cha"],["ra","sa","ba","pa"]], order: ["chal","pak","bus","chal","tap","par","sab","sach"] },
      { cols: [["ba","sa","sa","ra"],["ka","la","cha","pa"],["ba","ta","sa","ba"],["sa","pa","ra","sa"]], order: ["ras","sab","chal","pak","tap","sab","sar","bus"] },
      { cols: [["pa","ka","ra","sa"],["la","la","ba","ba"],["sa","pa","ta","ba"],["ka","pa","cha","sa"]], order: ["sar","sach","cup","bal","tap","pak","bus","bal"] },
      { cols: [["sa","ba","cha","ra"],["sa","sa","la","ra"],["pa","ta","ra","sa"],["ba","ka","ka","pa"]], order: ["ras","tap","pak","kab","chal","sar","bus","ras"] },
    ],
  },
  {
    cols: 5,
    rows: 4,
    bg: "linear-gradient(#ffe9f3 0%, #ffc2dd 55%, #ff9bc0 100%)",
    boards: [
      { cols: [["pa","pa","ta","ka"],["sa","ra","ka","ba"],["ra","ra","sa","pa"],["sa","ba","cha","ra"],["la","la","cha","sa"]], order: ["chal","tap","sach","sar","ras","ras","bal","par","cup","kab"] },
      { cols: [["la","cha","ka","pa"],["la","ba","sa","ba"],["ba","sa","ka","sa"],["pa","ra","ta","ba"],["ra","pa","pa","sa"]], order: ["bal","pak","chal","tap","sar","sab","cup","bus","par","bus"] },
      { cols: [["ba","la","ba","pa"],["pa","ra","ka","sa"],["sa","ba","ra","ba"],["ka","la","cha","pa"],["pa","ra","ta","pa"]], order: ["chal","par","tap","cup","bal","par","bus","kab","par","bus"] },
      { cols: [["sa","pa","ka","sa"],["ba","cha","sa","ba"],["la","cha","sa","ba"],["pa","ra","pa","ta"],["sa","ra","ra","sa"]], order: ["cup","tap","ras","ras","chal","par","sab","sab","sach","bus"] },
      { cols: [["ba","sa","ba","ka"],["sa","sa","la","cha"],["ta","ba","cha","cha"],["pa","la","pa","ka"],["ra","pa","pa","ka"]], order: ["tap","chal","par","kab","sach","pak","bal","sach","sab","cup"] },
      { cols: [["pa","ta","sa","pa"],["ba","ra","ra","ka"],["la","sa","ka","pa"],["ra","pa","ba","ka"],["la","ra","sa","cha"]], order: ["tap","ras","pak","kab","sar","chal","bal","pak","par","sar"] },
      { cols: [["ra","pa","pa","ta"],["cha","sa","la","cha"],["sa","sa","ba","ra"],["sa","pa","sa","ra"],["pa","ka","ra","ra"]], order: ["sach","ras","tap","par","chal","cup","sar","bus","ras","par"] },
      { cols: [["la","cha","ka","pa"],["ra","sa","ta","ba"],["ra","la","pa","pa"],["la","pa","ka","cha"],["ra","pa","sa","ba"]], order: ["bus","sar","par","bal","chal","par","tap","cup","chal","pak"] },
      { cols: [["ka","sa","ba","pa"],["ta","ra","ra","sa"],["pa","cha","sa","sa"],["ka","ra","ra","pa"],["la","sa","cha","ba"]], order: ["par","bus","sar","tap","ras","sach","chal","ras","kab","pak"] },
      { cols: [["sa","ba","ra","ka"],["sa","ba","ka","pa"],["cha","pa","la","ba"],["la","ka","ra","sa"],["ra","pa","pa","ta"]], order: ["tap","chal","par","cup","sar","pak","kab","bal","bus","ras"] },
      { cols: [["ba","ba","ka","sa"],["la","la","cha","cha"],["ba","pa","ka","ta"],["sa","ba","sa","pa"],["pa","sa","ra","ka"]], order: ["kab","bal","sab","chal","bus","cup","ras","cup","tap","sach"] },
      { cols: [["ra","pa","sa","ba"],["ka","pa","ta","pa"],["ba","sa","la","ba"],["ka","ra","sa","ra"],["cha","sa","sa","pa"]], order: ["par","sab","sar","bus","tap","ras","bal","sach","cup","pak"] },
      { cols: [["la","ba","cha","sa"],["cha","cha","sa","ka"],["ba","pa","la","ba"],["la","ra","ta","ka"],["pa","pa","ka","pa"]], order: ["pak","kab","par","chal","bus","chal","tap","sach","bal","cup"] },
      { cols: [["ka","ka","ra","sa"],["pa","sa","ba","pa"],["cha","sa","ka","ta"],["la","ba","pa","pa"],["sa","ra","ka","pa"]], order: ["sar","ras","sach","cup","bus","cup","bal","tap","cup","pak"] },
      { cols: [["ba","ka","pa","pa"],["la","pa","cha","ra"],["ka","la","ra","sa"],["cha","sa","pa","ta"],["pa","pa","ka","ka"]], order: ["sach","sar","pak","bal","chal","pak","par","cup","cup","tap"] },
      { cols: [["ba","ra","pa","sa"],["ka","la","ba","pa"],["pa","ba","sa","ta"],["sa","sa","cha","ra"],["ra","pa","ka","sa"]], order: ["ras","sach","bus","bal","sar","par","sab","tap","pak","cup"] },
      { cols: [["cha","sa","ra","sa"],["cha","ba","sa","pa"],["la","ka","pa","ra"],["sa","la","ba","ta"],["sa","ba","ba","pa"]], order: ["par","sach","tap","bal","pak","chal","sab","bus","sab","sar"] },
      { cols: [["pa","ka","pa","sa"],["ba","ka","ra","cha"],["ra","ka","ra","pa"],["sa","la","cha","pa"],["pa","ta","sa","ba"]], order: ["chal","sach","ras","tap","bus","pak","cup","par","kab","par"] },
      { cols: [["pa","ta","sa","ba"],["sa","ra","sa","pa"],["ra","sa","cha","ra"],["ba","sa","sa","cha"],["pa","ka","la","cha"]], order: ["cup","tap","bus","chal","sach","sab","sach","par","sar","ras"] },
      { cols: [["ra","pa","ba","sa"],["cha","ka","ba","sa"],["la","cha","la","pa"],["cha","sa","ba","sa"],["pa","sa","ba","ta"]], order: ["sach","bus","tap","bal","bus","sab","par","sach","chal","cup"] },
      { cols: [["ka","pa","sa","ka"],["pa","la","ba","ba"],["pa","sa","pa","ka"],["pa","ta","ra","ba"],["ka","cha","sa","pa"]], order: ["par","cup","sab","cup","bal","pak","sab","sach","cup","tap"] },
      { cols: [["la","cha","sa","ka"],["pa","sa","ra","ba"],["ka","ra","ba","ka"],["sa","ba","sa","sa"],["ba","cha","pa","ta"]], order: ["chal","pak","tap","kab","sar","bus","sar","sab","sach","kab"] },
      { cols: [["pa","ka","ba","sa"],["la","ta","cha","ka"],["cha","pa","pa","ba"],["la","pa","ka","ka"],["pa","ra","sa","ra"]], order: ["pak","par","cup","chal","cup","ras","bal","tap","sach","kab"] },
      { cols: [["sa","pa","ka","ba"],["cha","la","ra","sa"],["sa","ta","ra","pa"],["ba","pa","ra","sa"],["ra","sa","la","cha"]], order: ["sab","sach","ras","cup","sar","bal","tap","par","chal","sar"] },
      { cols: [["pa","la","ba","ka"],["ra","ta","pa","pa"],["ka","pa","ra","pa"],["cha","sa","ba","ka"],["la","ra","sa","cha"]], order: ["bal","kab","cup","sach","sar","pak","tap","par","chal","par"] },
      { cols: [["sa","pa","ta","ba"],["ra","la","ba","sa"],["sa","sa","ka","cha"],["ka","ba","ba","ra"],["pa","ka","pa","sa"]], order: ["bal","pak","ras","bus","kab","cup","sar","sach","tap","bus"] },
      { cols: [["ba","ka","pa","ta"],["ra","ka","sa","pa"],["la","ba","ba","sa"],["ka","ba","sa","sa"],["la","cha","pa","cha"]], order: ["chal","pak","kab","bal","sab","cup","sach","ras","bus","tap"] },
      { cols: [["ra","sa","ra","sa"],["pa","cha","ta","sa"],["pa","ka","ka","sa"],["la","ra","ba","pa"],["la","ba","ba","ka"]], order: ["cup","bal","kab","ras","sach","tap","ras","sar","bal","cup"] },
      { cols: [["la","ba","cha","sa"],["sa","ra","la","ra"],["ba","ka","pa","ka"],["ra","sa","ba","sa"],["la","cha","pa","ta"]], order: ["kab","tap","ras","cup","sar","sab","chal","bal","sar","chal"] },
      { cols: [["pa","ka","pa","ta"],["ka","ra","sa","pa"],["pa","ba","ka","pa"],["ra","sa","ra","la"],["cha","sa","la","cha"]], order: ["sach","ras","chal","bal","par","cup","tap","pak","sar","pak"] },
    ],
  },
];
