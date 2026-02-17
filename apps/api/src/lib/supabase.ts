import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseClient(anonKey: string): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not set");
  return createClient(url, anonKey);
}

export function createSupabaseAdmin(serviceRoleKey: string): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not set");
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
