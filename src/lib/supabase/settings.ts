import { createAdminClient } from "@/lib/supabaseAdmin";

export interface Setting {
  key: string;
  value: string | null;
  updated_at?: string;
}

// In-memory cache with 5-minute TTL
let settingsCache: Map<string, string | null> | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function getSettings(): Promise<Map<string, string | null>> {
  if (settingsCache && Date.now() < cacheExpiry) return settingsCache;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("settings").select("key, value");
    const map = new Map<string, string | null>();
    (data ?? []).forEach((s: { key: string; value: string | null }) =>
      map.set(s.key, s.value)
    );
    settingsCache = map;
    cacheExpiry = Date.now() + CACHE_TTL;
    return map;
  } catch {
    return new Map();
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const settings = await getSettings();
  return settings.get(key) ?? null;
}

export function invalidateSettingsCache() {
  settingsCache = null;
  cacheExpiry = 0;
}

export async function getAllSettings(): Promise<Setting[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("settings").select("*").order("key");
  return (data ?? []) as Setting[];
}

export async function upsertSetting(
  key: string,
  value: string | null
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  invalidateSettingsCache();
}
