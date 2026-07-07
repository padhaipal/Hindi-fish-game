// ---------------------------------------------------------------------------
// print-links.mjs — print all 60 play-gate links for the WhatsApp bot.
// ---------------------------------------------------------------------------
// Each game has a pool of 10 interchangeable links (bare slug + "-2".."-10");
// every link cools down independently (see middleware.ts). Run:
//
//   node scripts/print-links.mjs https://padhaipalsingleplay.vercel.app
//
// Pass --json to get a JSON array instead of one link per line.
// ---------------------------------------------------------------------------

const GAMES = ["fish", "blocks", "memory", "wordtrain", "pondhop", "lekhan"];
const PER_GAME = 10; // /blocks, /blocks-2 … /blocks-10

const rawBase = process.argv[2];
const asJson = process.argv.includes("--json");

if (!rawBase || rawBase.startsWith("--")) {
  console.error("Usage: node scripts/print-links.mjs https://<your-domain> [--json]");
  process.exit(1);
}
const base = rawBase.replace(/\/+$/, ""); // trim trailing slash

const links = [];
for (const g of GAMES) {
  for (let n = 1; n <= PER_GAME; n++) {
    links.push(`${base}/${n === 1 ? g : `${g}-${n}`}`);
  }
}

if (asJson) {
  console.log(JSON.stringify(links, null, 2));
} else {
  for (const g of GAMES) {
    console.log(`# ${g}`);
    for (let n = 1; n <= PER_GAME; n++) {
      console.log(`${base}/${n === 1 ? g : `${g}-${n}`}`);
    }
    console.log("");
  }
  console.log(`# ${links.length} links total (${GAMES.length} games × ${PER_GAME})`);
}
