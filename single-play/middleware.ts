// ---------------------------------------------------------------------------
// PLAY GATE — per-device, per-game cooldown (cookie based).
// ---------------------------------------------------------------------------
// Each game link (/fish, /blocks, …) is static and reusable. On the FIRST open
// on a device we set a cookie for that game; while the cookie is alive the link
// is "used" on that device and re-opening it shows the /used screen (go do
// another lesson to earn the next game). The cookie auto-expires after the
// cooldown window, so the game becomes playable again.
//
// No accounts, no server store — intentionally light: it just stops the same
// link being replayed over and over between lessons. Cookies are read on the
// first request (they travel with it), so this works from the WhatsApp in-app
// browser with a single tap — no second click needed.
//
// Config (env):
//   COOLDOWN_HOURS   how long a game stays "used" per device (default 168 = 7 days)
//   GATE_DISABLED=1  turn the gate off (handy for local dev)
// ---------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";

const GAMES = new Set(["fish", "blocks", "memory", "wordtrain", "pondhop", "lekhan"]);
const COOLDOWN_HOURS = Number(process.env.COOLDOWN_HOURS || 24 * 7); // default 7 days
const WINDOW_S = Math.max(1, COOLDOWN_HOURS) * 3600;
const GRACE_MS = 10 * 60 * 1000; // re-open / refresh works for 10 min after first open

export function middleware(req: NextRequest) {
  const game = req.nextUrl.pathname.split("/")[1];
  if (!GAMES.has(game) || process.env.GATE_DISABLED === "1") return NextResponse.next();

  const name = `pp_${game}`;
  const now = Date.now();
  const raw = req.cookies.get(name)?.value;
  const first = raw ? Number(raw) : null;

  // Already opened on this device (past the reload grace) -> "come back" screen.
  if (first && Number.isFinite(first) && now - first > GRACE_MS) {
    const used = req.nextUrl.clone();
    used.pathname = "/used";
    used.search = "";
    return NextResponse.rewrite(used);
  }

  const res = NextResponse.next();
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
  matcher: ["/fish", "/blocks", "/memory", "/wordtrain", "/pondhop", "/lekhan"],
};
