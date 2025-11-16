import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export const getBrowserSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }

  return browserClient;
};
