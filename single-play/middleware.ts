// ---------------------------------------------------------------------------
// ONE-TIME LINK GATE — middleware.
// ---------------------------------------------------------------------------
// Each child is sent a single-use link like  /fish?t=<token>. On first open we
// verify the token's signature, BURN its id (so it can never open again), set a
// short-lived signed session cookie (so an accidental reload still works for a
// few minutes), and strip the token from the address bar. A spent link — or a
// missing/invalid token with no live session — is sent to /used.
//
// The gate is a no-op unless LINK_SECRET is configured, so the app runs
// normally in dev / before you set things up.
// ---------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signSession, verifySession } from "@/lib/token";
import { burnOnce, gateEnabled, linkSecret, SESSION_COOKIE, GRACE_MS } from "@/lib/gate";

const GAMES = new Set(["fish", "blocks", "memory", "wordtrain", "pondhop", "lekhan"]);

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const game = pathname.split("/")[1];
  if (!GAMES.has(game) || !gateEnabled()) return NextResponse.next();

  const secret = linkSecret();
  const now = Date.now();

  // 1) live session cookie for THIS game -> allow (reload grace)
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie && (await verifySession(cookie, game, now, secret))) {
    return NextResponse.next();
  }

  // 2) a valid, unused token -> burn it, open a session, drop the token param
  const t = searchParams.get("t");
  const id = t ? await verifyToken(t, secret) : null;
  if (id && (await burnOnce(id))) {
    const clean = req.nextUrl.clone();
    clean.searchParams.delete("t");
    const res = NextResponse.redirect(clean);
    res.cookies.set(SESSION_COOKIE, await signSession(id, game, now + GRACE_MS, secret), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: Math.floor(GRACE_MS / 1000),
    });
    return res;
  }

  // 3) spent / invalid / missing -> the "already used" screen
  const used = req.nextUrl.clone();
  used.pathname = "/used";
  used.search = "";
  return NextResponse.rewrite(used);
}

export const config = {
  matcher: ["/fish", "/blocks", "/memory", "/wordtrain", "/pondhop", "/lekhan"],
};
