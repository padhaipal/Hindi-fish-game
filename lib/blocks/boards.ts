// ---------------------------------------------------------------------------
// PRE-GENERATED BOARDS for the Hindi Blocks game (FULL 5x4 grid = 20 blocks).
// ---------------------------------------------------------------------------
// Generated offline by scripts/generate-boards.mjs and VERIFIED winnable:
//   - 5 columns x 4 rows, full (index 0 = bottom of each column).
//   - `order` is the 10 words to clear, in sequence. At each step the words
//     letters are a UNIQUE adjacent pair (horizontal OR vertical), so the
//     childs correct move is always unambiguous and the board is winnable.
//   - All 8 letters (incl. त via तप) appear in every board.
// A random board is chosen at the start of each game.
// DO NOT hand-edit: re-run scripts/generate-boards.mjs if words/rules change.
// ---------------------------------------------------------------------------

export interface BoardData {
  cols: string[][]; // 5 columns of 4 letter ids, index 0 = bottom
  order: string[];  // word ids to clear, in sequence (length 10)
}

export const BOARDS: BoardData[] = [
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
];
