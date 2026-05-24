const DEFAULT_SCHEME = {
  presetId: "aurora",
  bgMode: "preset",
  uploadedB64: null,
  bgOpacity: 100,
  bgBrightness: 85,
  bgSaturation: 100,
  bgBlur: 0,
  bgFit: "cover",
  tabTintColor: "#302b63",
  tabOpacity: 75,
};

const STORAGE_KEY = "ahs_scheme";

export function loadScheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SCHEME, ...JSON.parse(raw) } : { ...DEFAULT_SCHEME };
  } catch {
    return { ...DEFAULT_SCHEME };
  }
}

export function saveScheme(scheme) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scheme));
  applyToDom(scheme);
}

export function applyToDom(scheme) {
  const r = document.documentElement;
  r.style.setProperty("--tint", scheme.tabTintColor);
  const hex = scheme.tabTintColor.replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");
  r.style.setProperty("--tint-rgb", rgb);
  r.style.setProperty("--tab-op", scheme.tabOpacity / 100);
}

// Supabase sync
const SB_URL = window.__ENV?.SUPABASE_URL || "";
const SB_KEY = window.__ENV?.SUPABASE_ANON_KEY || "";

export async function syncToCloud(userId, scheme) {
  if (!SB_URL || !userId) return;
  await fetch(`${SB_URL}/rest/v1/user_active_scheme`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ user_id: userId, scheme_json: scheme }),
  });
}

export async function loadFromCloud(userId) {
  if (!SB_URL || !userId) return null;
  const res = await fetch(
    `${SB_URL}/rest/v1/user_active_scheme?user_id=eq.${userId}&select=scheme_json`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  );
  const data = await res.json();
  return data?.[0]?.scheme_json || null;
}
