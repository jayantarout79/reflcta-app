export const hasSupabaseConfig =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const isDemoMode =
  process.env.NEXT_PUBLIC_ENABLE_DEMO === "true" || !hasSupabaseConfig;
