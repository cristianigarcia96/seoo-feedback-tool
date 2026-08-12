import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const source = (import.meta.env.VITE_DATA_SOURCE as string | undefined) ?? "auto";

/** True when we have enough config to talk to Supabase, honoring the override. */
export const useSupabase =
  source === "supabase" || (source === "auto" && Boolean(url && anonKey));

let client: SupabaseClient | null = null;

/** Lazily created singleton. Throws only if actually used without config. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!url || !anonKey) {
      throw new Error(
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, " +
          "or run with VITE_DATA_SOURCE=demo.",
      );
    }
    client = createClient(url, anonKey);
  }
  return client;
}
