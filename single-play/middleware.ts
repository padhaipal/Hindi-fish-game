// ---------------------------------------------------------------------------
// PLAY GATE — per-device, per-LINK cooldown (cookie based).
// ---------------------------------------------------------------------------
// Every game has a POOL of interchangeable links: the bare slug plus numbered
// variants, e.g. /blocks, /blocks-2, /blocks-3 … /blocks-10. They all open the
// SAME game, but each link has its OWN cookie, so its cooldown is independent.
//
// Why a pool? The bot sends a random game link after each lesson. With a single
// link per game, a random re-send could land on a link that's still cooling
// down. With ~10 independent links per game, the bot can keep handing out the
// same game and almost always pick one that's still fresh.
//
// On the FIRST open of a given link on a device we set a cookie for THAT link;
// while the cookie is alive, re-opening the SAME link shows the /used screen
// (go do another lesson). The cookie auto-expires after the cooldown window.
// A "-N" variant is rewritten to the real game page (/blocks-3 -> /blocks), so
// there are no extra page files to maintain.
//
// No accounts, no server store, no secrets — intentionally light. Cookies are
// read on the first request (they travel with it), so this works from the
// WhatsApp in-app browser with a single tap — no second click needed.
//
// Config (env):
//   COOLDOWN_HOURS   how long a link stays "used" per device (default 168 = 7 days)
//   GATE_DISABLED=1  turn the gate off (handy for local dev)
// ---------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";

const GAMES = new Set(["fish", "blocks", "memory", "wordtrain", "pondhop", "lekhan"]);
const COOLDOWN_HOURS = Number(process.env.COOLDOWN_HOURS || 24 * 7); // default 7 days
const WINDOW_S = Math.max(1, COOLDOWN_HOURS) * 3600;
const GRACE_MS = 10 * 60 * 1000; // re-open / refresh works for 10 min after first open

// "blocks" -> {game:"blocks"}; "blocks-3" -> {game:"blocks"}; anything else -> null.
function parse(seg: string): { game: string } | null {
  const m = /^([a-z]+)(?:-\d{1,2})?$/.exec(seg);
  if (!m || !GAMES.has(m[1])) return null;
  return { game: m[1] };
}

export function middleware(req: NextRequest) {
  const seg = req.nextUrl.pathname.split("/")[1] || "";
  const parsed = parse(seg);
  if (!parsed || process.env.GATE_DISABLED === "1") return NextResponse.next();

  const { game } = parsed;
  const name = `pp_${seg}`; // cookie is keyed to the FULL link slug -> independent cooldown
  const now = Date.now();
  const raw = req.cookies.get(name)?.value;
  const first = raw ? Number(raw) : null;

  // This link already opened on this device (past the reload grace) -> "come back".
  if (first && Number.isFinite(first) && now - first > GRACE_MS) {
    const used = req.nextUrl.clone();
    used.pathname = "/used";
    used.search = "";
    return NextResponse.rewrite(used);
  }

  // A "-N" variant renders the real game page; the bare slug already IS that page.
  const res =
    seg === game
      ? NextResponse.next()
      : NextResponse.rewrite(new URL(`/${game}`, req.url));

  if (!first) {
    res.cookies.set(name, String(now), {
      maxAge: WINDOW_S,
      path: "/",
      sameSite: "lax",
    });
  }
  return res;
}

export const config = {
  matcher: [
    "/:seg(fish|blocks|memory|wordtrain|pondhop|lekhan)",
    "/:seg(fish|blocks|memory|wordtrain|pondhop|lekhan)-:n(\\d{1,2})",
  ],
};
