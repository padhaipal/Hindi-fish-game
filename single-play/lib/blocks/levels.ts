// ---------------------------------------------------------------------------
// BLOCKS GAME — LEVELS (single-play)
// ---------------------------------------------------------------------------
// 4 levels of growing grids with PRE-GENERATED boards. EACH LETTER APPEARS AT
// MOST ONCE per board, and each word is a straight run of 2–4 blocks. Word
// lengths grow with the levels:
//   Lvl 1: 3x2  (2-letter words)
//   Lvl 2: 4x2  (2-letter words)
//   Lvl 3: 4x3  (2- & 3-letter words)
//   Lvl 4: 5x3  (2-, 3- & 4-letter words)  — 15 blocks, the biggest all-distinct
//          board possible with this word set.
// DO NOT hand-edit — regenerate with scripts/generate-boards.mjs.
// ---------------------------------------------------------------------------

export interface BoardData {
  cols: string[][]; // columns of letter ids, index 0 = bottom
  order: string[];  // word ids to clear, in sequence
}

export interface BlockLevel {
  cols: number;
  rows: number;
  bg: string;
  boards: BoardData[];
}

export const LEVELS: BlockLevel[] = [
  {
    cols: 3,
    rows: 2,
    bg: "linear-gradient(#e8ffe9 0%, #b8f0c0 55%, #8fe0a0 100%)",
    boards: [
      { cols: [["ra","gha"],["pa","ka"],["la","pha"]], order: ["kap","phal","ghar"] },
      { cols: [["la","pha"],["ra","gha"],["ba","tta"]], order: ["phal","tab","ghar"] },
      { cols: [["ba","gha"],["sa","ra"],["la","ha"]], order: ["hal","bas","ghar"] },
      { cols: [["na","ka"],["la","pa"],["sa","ba"]], order: ["kap","nal","bas"] },
      { cols: [["sa","ba"],["ka","gha"],["pa","ra"]], order: ["bas","kap","ghar"] },
      { cols: [["sa","ra"],["ha","tta"],["la","ba"]], order: ["ras","tab","hal"] },
      { cols: [["ka","ba"],["pa","sa"],["ra","gha"]], order: ["ghar","kap","bas"] },
      { cols: [["la","ha"],["ka","ra"],["pa","sa"]], order: ["ras","kap","hal"] },
      { cols: [["na","tta"],["la","ba"],["sa","ra"]], order: ["nal","ras","tab"] },
      { cols: [["la","ha"],["tta","gha"],["ba","ra"]], order: ["tab","ghar","hal"] },
      { cols: [["pa","ka"],["ha","ba"],["la","sa"]], order: ["bas","hal","kap"] },
      { cols: [["la","na"],["tta","ra"],["ba","sa"]], order: ["nal","ras","tab"] },
    ],
  },
  {
    cols: 4,
    rows: 2,
    bg: "linear-gradient(#e9f7ff 0%, #bfe6ff 55%, #93d4f5 100%)",
    boards: [
      { cols: [["ra","gha"],["pa","ka"],["pha","ba"],["la","sa"]], order: ["kap","ghar","phal","bas"] },
      { cols: [["la","pha"],["ra","gha"],["tta","ka"],["ba","pa"]], order: ["kap","tab","ghar","phal"] },
      { cols: [["ba","gha"],["sa","ra"],["ha","ka"],["la","pa"]], order: ["kap","bas","hal","ghar"] },
      { cols: [["na","ka"],["la","pa"],["ba","gha"],["sa","ra"]], order: ["kap","ghar","bas","nal"] },
      { cols: [["sa","ba"],["ka","na"],["pa","la"],["ra","gha"]], order: ["bas","ghar","kap","nal"] },
      { cols: [["sa","ra"],["ha","ka"],["la","pa"],["ba","tta"]], order: ["tab","hal","ras","kap"] },
      { cols: [["ka","ha"],["pa","la"],["ra","gha"],["sa","ba"]], order: ["kap","hal","ghar","bas"] },
      { cols: [["la","ha"],["ka","tta"],["pa","ba"],["sa","ra"]], order: ["hal","tab","ras","kap"] },
      { cols: [["na","ka"],["la","pa"],["sa","ra"],["ba","tta"]], order: ["nal","ras","kap","tab"] },
      { cols: [["la","ha"],["tta","ka"],["ba","pa"],["ra","gha"]], order: ["tab","kap","ghar","hal"] },
      { cols: [["pa","ka"],["ha","gha"],["la","ra"],["sa","ba"]], order: ["kap","bas","hal","ghar"] },
      { cols: [["la","na"],["tta","ka"],["ba","pa"],["sa","ra"]], order: ["kap","tab","ras","nal"] },
    ],
  },
  {
    cols: 4,
    rows: 3,
    bg: "linear-gradient(#f1e9ff 0%, #d6c2ff 55%, #b79bf0 100%)",
    boards: [
      { cols: [["tta","ma","sha"],["ba","ga","ha"],["na","ra","da"],["la","pa","ka"]], order: ["shahad","nal","kap","tab","magar"] },
      { cols: [["ma","sha","ka"],["ga","ha","pa"],["ra","da","ba"],["la","pha","sa"]], order: ["magar","kap","shahad","phal","bas"] },
      { cols: [["sha","ba","ka"],["ha","sa","pa"],["da","la","na"],["ra","tta","ma"]], order: ["matar","bas","kap","nal","shahad"] },
      { cols: [["ba","ma","pa"],["ta","tta","la"],["kha","ra","ka"],["da","ha","sha"]], order: ["palak","shahad","matar","batakh"] },
      { cols: [["kha","ta","ba"],["sa","ra","sha"],["la","na","ha"],["pa","ka","da"]], order: ["shahad","batakh","kap","nal","ras"] },
      { cols: [["gha","la","pha"],["ra","pa","ka"],["da","ha","sha"],["na","tta","ba"]], order: ["kap","batan","phal","ghar","shahad"] },
      { cols: [["tta","pha","ka"],["ba","la","pa"],["da","ha","sha"],["ra","ga","ma"]], order: ["magar","kap","phal","shahad","tab"] },
      { cols: [["kha","ta","ba"],["pha","ka","sha"],["la","pa","ha"],["ra","gha","da"]], order: ["batakh","shahad","kap","ghar","phal"] },
      { cols: [["ma","pa","sha"],["ga","la","ha"],["ra","ka","da"],["na","tta","ba"]], order: ["palak","magar","shahad","batan"] },
      { cols: [["ma","pa","sha"],["tta","la","ha"],["ra","ka","da"],["kha","ta","ba"]], order: ["shahad","batakh","palak","matar"] },
      { cols: [["ka","la","pa"],["ma","ba","sha"],["tta","ta","ha"],["ra","kha","da"]], order: ["palak","matar","shahad","batakh"] },
      { cols: [["ba","tta","sha"],["pha","gha","ha"],["la","ra","da"],["ka","ma","na"]], order: ["tab","namak","ghar","phal","shahad"] },
    ],
  },
  {
    cols: 5,
    rows: 3,
    bg: "linear-gradient(#fff0db 0%, #ffd9a8 55%, #ffc078 100%)",
    boards: [
      { cols: [["ba","sha","a"],["ta","ha","ja"],["kha","da","ga"],["la","pha","ra"],["ka","ma","na"]], order: ["batakh","shahad","namak","phal","ajgar"] },
      { cols: [["kha","ta","ba"],["sha","na","a"],["ha","ma","ja"],["da","ka","ga"],["la","pha","ra"]], order: ["ajgar","phal","namak","batakh","shahad"] },
      { cols: [["la","pha","a"],["ba","na","ja"],["ta","ma","ga"],["kha","ka","ra"],["da","ha","sha"]], order: ["shahad","namak","phal","batakh","ajgar"] },
      { cols: [["la","pha","a"],["na","ba","ja"],["ma","ta","ga"],["ka","kha","ra"],["da","ha","sha"]], order: ["namak","shahad","batakh","phal","ajgar"] },
      { cols: [["la","pha","a"],["sha","ba","ja"],["ha","ta","ga"],["da","kha","ra"],["ka","ma","na"]], order: ["shahad","namak","batakh","phal","ajgar"] },
      { cols: [["a","na","sha"],["ja","ma","ha"],["ga","ka","da"],["ra","la","pha"],["kha","ta","ba"]], order: ["namak","phal","batakh","shahad","ajgar"] },
      { cols: [["ba","na","a"],["ta","ma","ja"],["kha","ka","ga"],["la","pha","ra"],["da","ha","sha"]], order: ["phal","namak","batakh","ajgar","shahad"] },
      { cols: [["a","sha","na"],["ja","ha","ma"],["ga","da","ka"],["ra","la","pha"],["kha","ta","ba"]], order: ["shahad","namak","phal","batakh","ajgar"] },
    ],
  },
];
