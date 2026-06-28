// ---------------------------------------------------------------------------
// PRE-GENERATED BOARDS for the Hindi Blocks game.
// ---------------------------------------------------------------------------
// Generated offline by scripts/generate-boards.mjs and VERIFIED winnable:
//   - 14 blocks each (columns, index 0 = bottom).
//   - `order` is the 7 words to clear, in sequence. At each step the words
//     letters are a UNIQUE horizontally-adjacent pair, so the childs correct
//     move is always unambiguous and the board is always winnable.
//   - All 8 letters (incl. त via तप) appear in every board.
// A random board is chosen at the start of each game.
// DO NOT hand-edit: re-run scripts/generate-boards.mjs if words/rules change.
// ---------------------------------------------------------------------------

export interface BoardData {
  cols: string[][]; // columns of letter ids, index 0 = bottom
  order: string[];  // word ids to clear, in sequence (length 7)
}

export const BOARDS: BoardData[] = [
  { cols: [["pa","sa","pa"],["ka","ra","ra","ka"],["ta","ba","cha","pa"],["pa","la","la"]], order: ["bal","tap","chal","pak","par","sar","cup"] },
  { cols: [["sa","ra","ba"],["sa","ra","sa","la"],["ra","cha"],["sa","ka","ta"],["pa","ba"]], order: ["kab","ras","sach","sar","bal","tap","ras"] },
  { cols: [["ka","ka","sa"],["ba","ta","ra","ba"],["sa","ba","cha","pa"],["ba","sa","la"]], order: ["sab","bus","chal","kab","sar","tap","kab"] },
  { cols: [["ba","sa"],["la","ra","ra"],["sa","sa","ta"],["ba","ka","pa","sa"],["cha","ba"]], order: ["tap","kab","ras","sar","sab","bal","sach"] },
  { cols: [["pa","sa","sa"],["ka","ra","pa","ra"],["ka","ra","ta","cha"],["ba","la","pa"]], order: ["tap","sar","par","pak","chal","sar","kab"] },
  { cols: [["sa","cha","pa"],["sa","cha","ra","la"],["ba","ta","ba","ka"],["pa","pa","sa"]], order: ["bus","tap","par","sab","chal","cup","sach"] },
  { cols: [["pa","ka","cha"],["ra","pa","la","sa"],["cha","ta","sa","pa"],["ka","pa","ba"]], order: ["chal","par","cup","sab","tap","sach","pak"] },
  { cols: [["sa","sa"],["ba","cha","ta","ka"],["ra","pa","ba"],["pa","sa","cha"],["ka","la"]], order: ["pak","ras","sab","chal","sach","tap","kab"] },
  { cols: [["sa","ka","ta"],["sa","ba","pa","cha"],["ka","sa","cha","cha"],["pa","ra","la"]], order: ["sar","kab","tap","cup","sach","chal","sach"] },
  { cols: [["sa","ka"],["ba","ba","ba","ta"],["ra","pa","la"],["sa","cha","sa"],["cha","la"]], order: ["sab","kab","sach","chal","tap","ras","bal"] },
  { cols: [["sa","ta"],["ka","pa","cha"],["pa","ra","ba"],["ra","sa","cha","ra"],["la","sa"]], order: ["tap","par","ras","ras","kab","sach","chal"] },
  { cols: [["ta","ba"],["pa","pa","sa","sa"],["cha","ra","cha"],["la","pa","ra"],["ka","sa"]], order: ["tap","sach","chal","par","ras","pak","bus"] },
  { cols: [["sa","ta","ka"],["ba","pa","ba","sa"],["cha","ka","sa","ba"],["ba","la","ra"]], order: ["tap","sab","kab","sar","sach","bal","kab"] },
  { cols: [["pa","ba"],["ka","la","ta","ra"],["ka","sa","pa"],["sa","pa","cha"],["ra","la"]], order: ["sar","pak","bal","ras","cup","chal","tap"] },
  { cols: [["cha","ta"],["sa","la","pa"],["ra","sa","sa"],["ka","ba","ra","pa"],["pa","ka"]], order: ["sab","cup","sar","sar","tap","pak","chal"] },
  { cols: [["sa","ba"],["cha","sa","ra","ka"],["sa","sa","pa"],["cha","ta","ba"],["la","pa"]], order: ["tap","sab","chal","sach","bus","ras","cup"] },
  { cols: [["pa","ta","ba"],["cha","ka","pa","la"],["pa","ba","ra","la"],["ka","la","sa"]], order: ["ras","bal","pak","chal","bal","tap","pak"] },
  { cols: [["pa","ta","ba"],["ka","pa","sa","ba"],["cha","pa","ra","la"],["la","ra","sa"]], order: ["ras","pak","par","bus","chal","tap","bal"] },
  { cols: [["ba","ra","cha"],["la","sa","la"],["ta","sa"],["ka","ba","ka","pa"],["pa","ba"]], order: ["ras","chal","bal","sab","cup","kab","tap"] },
  { cols: [["ka","ta"],["pa","pa","cha"],["sa","ra","la"],["ba","sa","ka","cha"],["sa","ba"]], order: ["chal","cup","ras","tap","bus","kab","sach"] },
  { cols: [["ra","pa","ta"],["sa","ra","cha","pa"],["la","ba"],["pa","sa","la"],["ka","ra"]], order: ["pak","sar","par","ras","chal","tap","bal"] },
  { cols: [["pa","pa","sa"],["sa","ka","ba","ra"],["ra","ta","cha","ba"],["pa","la","sa"]], order: ["sab","sar","tap","pak","bus","chal","par"] },
  { cols: [["ka","ka"],["pa","ba","ba"],["cha","ta","sa"],["la","pa","ra","sa"],["ba","sa"]], order: ["bus","kab","tap","ras","chal","cup","sab"] },
  { cols: [["sa","pa","ta"],["ra","ka","pa"],["cha","sa"],["la","cha","cha","ka"],["la","ba"]], order: ["sar","chal","chal","sach","tap","kab","pak"] },
  { cols: [["ta","cha","pa"],["pa","la","sa","ra"],["ba","ka","cha","ba"],["la","ba","sa"]], order: ["kab","tap","sach","par","chal","bal","bus"] },
  { cols: [["pa","sa","ta"],["ka","ra","pa","cha"],["sa","la","ba","ra"],["cha","sa","la"]], order: ["tap","sar","pak","sach","bal","chal","ras"] },
  { cols: [["ra","cha"],["sa","pa","la"],["ta","ka","sa"],["sa","cha","ka","pa"],["ba","ba"]], order: ["pak","sach","ras","sab","kab","tap","chal"] },
  { cols: [["ta","pa"],["pa","ra","sa","sa"],["cha","ba"],["ba","ka","cha"],["la","ba","la"]], order: ["tap","chal","bal","kab","par","sab","sach"] },
  { cols: [["ba","cha","sa"],["sa","la","ra"],["ta","ba"],["pa","ka","pa","la"],["ra","pa"]], order: ["par","bus","cup","tap","bal","chal","sar"] },
  { cols: [["ba","ta","cha"],["ra","pa","sa","la"],["sa","ra","ka","pa"],["sa","ba","ra"]], order: ["tap","ras","kab","chal","bus","ras","par"] },
];
