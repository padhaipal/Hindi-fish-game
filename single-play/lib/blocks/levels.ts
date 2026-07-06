// ---------------------------------------------------------------------------
// BLOCKS GAME — LEVELS (single-play)
// ---------------------------------------------------------------------------
// 3 levels of growing grids with PRE-GENERATED boards (all VERIFIED winnable:
// every word is a unique adjacent pair at its step). EACH LETTER APPEARS AT MOST
// ONCE per board. With 8 two-letter words there are only 11 distinct letters, so
// the biggest all-distinct board is 4x2 (8 blocks) — hence no larger levels.
//   Lvl 1: 2x2 (2 words)   Lvl 2: 3x2 (3 words)   Lvl 3: 4x2 (4 words)
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
    cols: 2,
    rows: 2,
    bg: "linear-gradient(#e8ffe9 0%, #b8f0c0 55%, #8fe0a0 100%)",
    boards: [
      { cols: [["ba","tta"],["ra","gha"]], order: ["tab","ghar"] },
      { cols: [["ba","tta"],["la","pha"]], order: ["tab","phal"] },
      { cols: [["tta","na"],["ba","la"]], order: ["tab","nal"] },
      { cols: [["la","ha"],["sa","ba"]], order: ["hal","bas"] },
      { cols: [["sa","ba"],["la","na"]], order: ["bas","nal"] },
      { cols: [["ka","pha"],["pa","la"]], order: ["kap","phal"] },
      { cols: [["pa","ka"],["sa","ra"]], order: ["ras","kap"] },
      { cols: [["sa","ra"],["la","ha"]], order: ["ras","hal"] },
    ],
  },
  {
    cols: 3,
    rows: 2,
    bg: "linear-gradient(#e9f7ff 0%, #bfe6ff 55%, #93d4f5 100%)",
    boards: [
      { cols: [["la","na"],["ba","tta"],["ra","gha"]], order: ["nal","tab","ghar"] },
      { cols: [["pa","ka"],["ra","gha"],["la","ha"]], order: ["hal","kap","ghar"] },
      { cols: [["la","na"],["ra","tta"],["sa","ba"]], order: ["tab","nal","ras"] },
      { cols: [["ba","gha"],["sa","ra"],["pa","ka"]], order: ["bas","kap","ghar"] },
      { cols: [["tta","pha"],["ba","la"],["sa","ra"]], order: ["ras","phal","tab"] },
      { cols: [["pa","ka"],["ra","gha"],["la","pha"]], order: ["ghar","phal","kap"] },
      { cols: [["ba","tta"],["la","na"],["pa","ka"]], order: ["kap","nal","tab"] },
      { cols: [["ba","tta"],["sa","ra"],["la","pha"]], order: ["tab","ras","phal"] },
      { cols: [["sa","ba"],["pa","ka"],["ra","gha"]], order: ["ghar","bas","kap"] },
      { cols: [["la","ha"],["pa","ka"],["sa","ba"]], order: ["bas","kap","hal"] },
      { cols: [["ra","gha"],["ha","ka"],["la","pa"]], order: ["ghar","kap","hal"] },
      { cols: [["sa","ba"],["la","pha"],["pa","ka"]], order: ["kap","bas","phal"] },
    ],
  },
  {
    cols: 4,
    rows: 2,
    bg: "linear-gradient(#f1e9ff 0%, #d6c2ff 55%, #b79bf0 100%)",
    boards: [
      { cols: [["ba","tta"],["sa","ra"],["ka","pha"],["pa","la"]], order: ["phal","ras","kap","tab"] },
      { cols: [["pa","ka"],["ra","gha"],["ba","tta"],["la","pha"]], order: ["tab","phal","kap","ghar"] },
      { cols: [["pha","ra"],["la","sa"],["ba","tta"],["pa","ka"]], order: ["ras","tab","kap","phal"] },
      { cols: [["na","ka"],["la","pa"],["tta","gha"],["ba","ra"]], order: ["kap","nal","ghar","tab"] },
      { cols: [["tta","ra"],["ba","sa"],["ka","pha"],["pa","la"]], order: ["ras","tab","phal","kap"] },
      { cols: [["ka","ra"],["pa","sa"],["ba","tta"],["la","na"]], order: ["kap","nal","tab","ras"] },
      { cols: [["sa","ba"],["ra","gha"],["la","ha"],["pa","ka"]], order: ["bas","hal","ghar","kap"] },
      { cols: [["sa","ba"],["ra","gha"],["pha","ka"],["la","pa"]], order: ["phal","bas","kap","ghar"] },
      { cols: [["pha","ba"],["la","sa"],["ra","gha"],["pa","ka"]], order: ["ghar","bas","phal","kap"] },
      { cols: [["ba","tta"],["ka","ra"],["pa","sa"],["la","pha"]], order: ["kap","tab","ras","phal"] },
      { cols: [["na","gha"],["la","ra"],["ba","ka"],["sa","pa"]], order: ["ghar","nal","kap","bas"] },
      { cols: [["ba","tta"],["ra","gha"],["la","pha"],["pa","ka"]], order: ["ghar","kap","phal","tab"] },
    ],
  },
];
