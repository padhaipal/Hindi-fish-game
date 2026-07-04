// ---------------------------------------------------------------------------
// BLOCKS GAME — LEVELS (single-play)
// ---------------------------------------------------------------------------
// 4 levels of growing grids, each with PRE-GENERATED boards (all VERIFIED
// winnable: every word is a unique adjacent pair at its step). A random board is
// chosen each play. With 8 two-letter words the biggest winnable grid is 4x4
// (8 words), so there is no 5x4 level here.
//   Lvl 1: 3x2 (3 words)   Lvl 2: 4x2 (4 words)
//   Lvl 3: 4x3 (6 words)   Lvl 4: 4x4 (8 words)
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
      { cols: [["la","na"],["ba","tta"],["ra","gha"]], order: ["nal","tab","ghar"] },
      { cols: [["pa","ka"],["ra","gha"],["la","ha"]], order: ["hal","kap","ghar"] },
      { cols: [["la","na"],["ra","tta"],["sa","ba"]], order: ["tab","nal","ras"] },
      { cols: [["na","gha"],["la","ra"],["sa","ra"]], order: ["ghar","ras","nal"] },
      { cols: [["la","na"],["ba","tta"],["pa","ka"]], order: ["tab","nal","kap"] },
      { cols: [["ra","gha"],["tta","pha"],["ba","la"]], order: ["phal","tab","ghar"] },
      { cols: [["ha","ka"],["la","pa"],["sa","ra"]], order: ["ras","kap","hal"] },
      { cols: [["sa","ra"],["gha","tta"],["ra","ba"]], order: ["tab","ghar","ras"] },
      { cols: [["sa","ba"],["la","ha"],["la","pha"]], order: ["hal","phal","bas"] },
      { cols: [["la","na"],["pa","ka"],["ba","tta"]], order: ["nal","kap","tab"] },
      { cols: [["ba","tta"],["ra","pha"],["sa","la"]], order: ["ras","tab","phal"] },
      { cols: [["ra","ka"],["sa","pa"],["la","pha"]], order: ["ras","kap","phal"] },
      { cols: [["la","pha"],["gha","ra"],["ra","sa"]], order: ["phal","ras","ghar"] },
      { cols: [["ka","gha"],["pa","ra"],["la","ha"]], order: ["hal","ghar","kap"] },
    ],
  },
  {
    cols: 4,
    rows: 2,
    bg: "linear-gradient(#e9f7ff 0%, #bfe6ff 55%, #93d4f5 100%)",
    boards: [
      { cols: [["sa","ba"],["la","na"],["ba","tta"],["ra","gha"]], order: ["tab","bas","nal","ghar"] },
      { cols: [["la","ha"],["sa","ba"],["la","na"],["sa","ra"]], order: ["hal","nal","ras","bas"] },
      { cols: [["ba","tta"],["la","pha"],["pa","ka"],["la","na"]], order: ["phal","tab","kap","nal"] },
      { cols: [["pa","ka"],["sa","ba"],["ra","na"],["sa","la"]], order: ["nal","ras","kap","bas"] },
      { cols: [["ba","tta"],["ra","gha"],["la","ha"],["sa","ba"]], order: ["hal","tab","ghar","bas"] },
      { cols: [["ra","gha"],["la","na"],["tta","ra"],["ba","sa"]], order: ["ras","tab","ghar","nal"] },
      { cols: [["la","ha"],["ba","tta"],["la","pha"],["la","na"]], order: ["hal","phal","nal","tab"] },
      { cols: [["na","gha"],["la","ra"],["pa","ka"],["la","pha"]], order: ["kap","ghar","phal","nal"] },
      { cols: [["ba","tta"],["ra","gha"],["ba","ka"],["sa","pa"]], order: ["ghar","bas","tab","kap"] },
      { cols: [["sa","ra"],["ra","gha"],["la","ha"],["la","na"]], order: ["hal","ras","ghar","nal"] },
      { cols: [["la","ha"],["sa","ra"],["gha","na"],["ra","la"]], order: ["nal","hal","ghar","ras"] },
      { cols: [["pha","ra"],["la","sa"],["ba","tta"],["pa","ka"]], order: ["ras","tab","kap","phal"] },
    ],
  },
  {
    cols: 4,
    rows: 3,
    bg: "linear-gradient(#f1e9ff 0%, #d6c2ff 55%, #b79bf0 100%)",
    boards: [
      { cols: [["tta","pa","ka"],["ba","ra","na"],["sa","pha","la"],["la","sa","ba"]], order: ["tab","bas","kap","ras","phal","nal"] },
      { cols: [["ra","la","na"],["gha","sa","ha"],["ba","ra","la"],["sa","pa","ka"]], order: ["kap","nal","hal","bas","ghar","ras"] },
      { cols: [["pha","la","ha"],["la","sa","ba"],["pa","ka","tta"],["sa","ra","ba"]], order: ["bas","kap","hal","ras","tab","phal"] },
      { cols: [["ha","la","pha"],["la","ba","tta"],["ka","na","ra"],["pa","la","sa"]], order: ["ras","hal","phal","kap","tab","nal"] },
      { cols: [["ra","ra","gha"],["ba","tta","sa"],["la","ha","pha"],["la","na","la"]], order: ["phal","ghar","tab","nal","hal","ras"] },
      { cols: [["sa","ba","ra"],["sa","tta","na"],["ka","la","ba"],["pa","ra","gha"]], order: ["bas","kap","ghar","tab","ras","nal"] },
      { cols: [["ba","ba","tta"],["sa","pa","ka"],["gha","la","ha"],["ra","sa","ra"]], order: ["ras","bas","kap","ghar","hal","tab"] },
      { cols: [["ha","pa","ka"],["la","ra","gha"],["ba","la","na"],["sa","la","pha"]], order: ["bas","ghar","nal","phal","kap","hal"] },
      { cols: [["ka","sa","ba"],["pa","ba","tta"],["ra","pha","gha"],["la","la","ha"]], order: ["tab","bas","phal","ghar","hal","kap"] },
      { cols: [["ra","la","pha"],["sa","ha","tta"],["ba","la","gha"],["ra","sa","ba"]], order: ["phal","bas","hal","ras","tab","ghar"] },
      { cols: [["ra","la","pha"],["sa","sa","ba"],["gha","la","ha"],["pa","ka","ra"]], order: ["kap","ras","hal","phal","ghar","bas"] },
      { cols: [["sa","ka","ba"],["pha","pa","ra"],["la","ha","sa"],["la","la","na"]], order: ["kap","bas","nal","phal","hal","ras"] },
    ],
  },
  {
    cols: 4,
    rows: 4,
    bg: "linear-gradient(#fff0db 0%, #ffd9a8 55%, #ffc078 100%)",
    boards: [
      { cols: [["sa","pa","ka","ba"],["ha","pha","sa","ra"],["la","la","la","na"],["ba","tta","ra","gha"]], order: ["hal","phal","ras","ghar","nal","kap","tab","bas"] },
      { cols: [["la","ha","pa","ka"],["ra","gha","sa","ba"],["pha","ba","tta","ra"],["la","sa","la","na"]], order: ["kap","ghar","phal","hal","nal","tab","bas","ras"] },
      { cols: [["sa","ra","la","na"],["ha","tta","pa","ka"],["ba","la","ba","gha"],["la","pha","sa","ra"]], order: ["ghar","ras","nal","phal","kap","bas","tab","hal"] },
      { cols: [["pha","ba","tta","ka"],["la","pa","sa","ba"],["la","na","ra","ha"],["ra","gha","sa","la"]], order: ["hal","nal","ghar","bas","tab","kap","ras","phal"] },
      { cols: [["pa","sa","ra","ka"],["tta","pha","la","na"],["ba","la","ba","gha"],["sa","ra","la","ha"]], order: ["tab","phal","ghar","nal","ras","kap","hal","bas"] },
      { cols: [["la","ha","pha","ka"],["la","pa","sa","ra"],["la","na","ba","tta"],["sa","ba","ra","gha"]], order: ["tab","hal","phal","bas","ras","kap","ghar","nal"] },
      { cols: [["pa","ka","ba","na"],["ba","tta","sa","la"],["la","pha","ra","gha"],["sa","ra","la","ha"]], order: ["hal","kap","ghar","ras","tab","phal","nal","bas"] },
      { cols: [["ra","ra","ha","gha"],["pa","ka","la","sa"],["ba","tta","pha","ba"],["sa","la","la","na"]], order: ["hal","ghar","phal","tab","kap","nal","ras","bas"] },
      { cols: [["sa","la","pha","ra"],["sa","ka","ba","gha"],["la","pa","ha","ra"],["la","ba","tta","na"]], order: ["kap","tab","phal","hal","ras","bas","nal","ghar"] },
      { cols: [["ka","la","pha","na"],["la","ha","pa","la"],["sa","ra","gha","ra"],["ba","tta","sa","ba"]], order: ["phal","hal","nal","tab","bas","ghar","ras","kap"] },
    ],
  },
];
