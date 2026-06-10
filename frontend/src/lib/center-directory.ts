// Fetches the full SVP center directory (site_id → name/city) once and caches
// the result in memory. The svp-proxy edge function aggregates the SVP API list
// + static fallback + Supabase DB, so any site_id encountered in exam sessions
// can be resolved to a real, full center name.
import { api } from "@/lib/api";

export interface DirectoryCenter {
  site_id: number | null;
  test_center_id: number | null;
  name: string;
  city: string | null;
}

let cache: { fetchedAt: number; bySiteId: Map<number, DirectoryCenter>; byTestCenterId: Map<number, DirectoryCenter> } | null = null;
let inflight: Promise<typeof cache> | null = null;
const TTL_MS = 10 * 60 * 1000;

async function loadDirectory(force = false) {
  if (!force && cache && Date.now() - cache.fetchedAt < TTL_MS) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const data: any = await api(`/center-directory${force ? "?refresh=1" : ""}`);
      const centers: DirectoryCenter[] = Array.isArray(data?.centers) ? data.centers : [];
      const bySiteId = new Map<number, DirectoryCenter>();
      const byTestCenterId = new Map<number, DirectoryCenter>();
      centers.forEach((c) => {
        if (c.site_id) bySiteId.set(Number(c.site_id), c);
        if (c.test_center_id) byTestCenterId.set(Number(c.test_center_id), c);
      });
      cache = { fetchedAt: Date.now(), bySiteId, byTestCenterId };
      return cache;
    } catch {
      // Failed fetch shouldn't break the UI; keep an empty cache so callers fall
      // back to their existing resolvers.
      cache = { fetchedAt: Date.now(), bySiteId: new Map(), byTestCenterId: new Map() };
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function ensureCenterDirectory(force = false) {
  return loadDirectory(force);
}

export function getDirectoryCenterName(siteId?: number | string | null, testCenterId?: number | string | null): string | undefined {
  if (!cache) return undefined;
  const s = Number(siteId);
  if (Number.isFinite(s) && s > 0 && cache.bySiteId.has(s)) return cache.bySiteId.get(s)!.name;
  const t = Number(testCenterId);
  if (Number.isFinite(t) && t > 0 && cache.byTestCenterId.has(t)) return cache.byTestCenterId.get(t)!.name;
  return undefined;
}
