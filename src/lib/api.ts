const DEFAULT_BACKEND_URL = "https://aci-api-production.up.railway.app";
const BASE = (import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/+$/, "");

async function doFetch(path: string, opts: RequestInit) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { res, data };
}

export async function api<T = any>(
  path: string,
  { method = "GET", body, token }: { method?: string; body?: any; token?: string } = {}
): Promise<T> {
  let access =
    token ||
    (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

  const makeOpts = (accessToken: string | null): RequestInit => ({
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: "include" as RequestCredentials,
    body: body ? JSON.stringify(body) : undefined,
  });

  let { res, data } = await doFetch(path, makeOpts(access));

  if (res.status === 401) {
    const r = await doFetch("/api/auth/refresh", makeOpts(null));
    if (r.res.ok && r.data?.accessToken) {
      access = r.data.accessToken;
      if (typeof window !== "undefined") localStorage.setItem("accessToken", access!);
      ({ res, data } = await doFetch(path, makeOpts(access)));
    }
  }

  if (!res.ok) throw Object.assign(new Error("Request failed"), { status: res.status, data });
  return data as T;
}

export function getBackendUrl() {
  return BASE;
}
