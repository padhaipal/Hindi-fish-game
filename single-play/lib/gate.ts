// ---------------------------------------------------------------------------
// ONE-TIME LINK GATE — config + the "burn" store.
// ---------------------------------------------------------------------------
// The gate is only ACTIVE when LINK_SECRET is set (and GATE_DISABLED !== "1").
// Without it the app runs wide open — handy for local dev and for a first
// deploy before you wire up the store.
//
// Burning a token id = recording "this id has now been used". In production
// this MUST be a shared store so it holds across serverless instances — we use
// Upstash Redis over its REST API (set UPSTASH_REDIS_REST_URL + _TOKEN). If
// those are absent we fall back to an in-memory Set: fine for a single local
// server, NOT reliable in a multi-instance deployment (documented, best-effort).
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = "pp_play";
export const GRACE_MS = 15 * 60 * 1000; // reloads allowed for 15 min after first open

export function linkSecret(): string {
  return (process.env.LINK_SECRET || "").trim();
}

export function gateEnabled(): boolean {
  return linkSecret().length > 0 && process.env.GATE_DISABLED !== "1";
}

// dev-only fallback store (per-instance, non-persistent)
const memBurned = new Set<string>();

// Atomically burn an id. Returns true if this call burned it (first use),
// false if it was already burned.
export async function burnOnce(id: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) {
    // SET burn:<id> 1 NX  -> {"result":"OK"} if newly set, {"result":null} if it existed
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["SET", `burn:${id}`, "1", "NX"]),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`store error ${res.status}`);
    const j = (await res.json()) as { result: string | null };
    return j.result === "OK";
  }
  // in-memory fallback
  if (memBurned.has(id)) return false;
  memBurned.add(id);
  return true;
}
