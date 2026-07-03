// ---------------------------------------------------------------------------
// MINT — generate one-time play links for the WhatsApp bot.
// ---------------------------------------------------------------------------
//   GET /api/mint?key=<MINT_SECRET>&game=fish&n=5
// Returns JSON { links: [ "https://<host>/fish?t=<token>", ... ] }.
// Guarded by MINT_SECRET so only your bot can mint. Each token is a random id
// signed with LINK_SECRET; it opens its game exactly once (see middleware).
//
// If your bot can compute HMAC-SHA256 itself, it can mint links without this
// endpoint — token = `<uuid>.<base64url(HMAC_SHA256(uuid, LINK_SECRET))>`.
// ---------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/token";
import { linkSecret } from "@/lib/gate";

const GAMES = new Set(["fish", "blocks", "memory", "wordtrain", "pondhop", "lekhan"]);

export async function GET(req: NextRequest) {
  const mintSecret = process.env.MINT_SECRET || "";
  const secret = linkSecret();
  if (!mintSecret || !secret) {
    return NextResponse.json({ error: "minting not configured" }, { status: 503 });
  }

  const sp = req.nextUrl.searchParams;
  if (sp.get("key") !== mintSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const game = sp.get("game") || "";
  if (!GAMES.has(game)) {
    return NextResponse.json({ error: `unknown game (use one of ${[...GAMES].join(", ")})` }, { status: 400 });
  }
  const n = Math.min(Math.max(parseInt(sp.get("n") || "1", 10) || 1, 1), 100);
  const base = (sp.get("base") || req.nextUrl.origin).replace(/\/$/, "");

  const links: string[] = [];
  for (let i = 0; i < n; i++) {
    const id = crypto.randomUUID().replace(/-/g, "");
    const token = await signToken(id, secret);
    links.push(`${base}/${game}?t=${token}`);
  }
  return NextResponse.json({ game, count: links.length, links }, { headers: { "cache-control": "no-store" } });
}
