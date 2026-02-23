import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not set");
  return url;
}

let _anonClient: SupabaseClient | null = null;
let _adminClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_anonClient) {
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!anonKey) throw new Error("SUPABASE_ANON_KEY is not set");
    _anonClient = createClient(getSupabaseUrl(), anonKey);
  }
  return _anonClient;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    _adminClient = createClient(getSupabaseUrl(), serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _adminClient;
}

/** @deprecated Use getSupabaseClient() instead */
export function createSupabaseClient(anonKey: string): SupabaseClient {
  return createClient(getSupabaseUrl(), anonKey);
}

/** @deprecated Use getSupabaseAdmin() instead */
export function createSupabaseAdmin(serviceRoleKey: string): SupabaseClient {
  return createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Reset singletons (for testing) */
export function _resetClients(): void {
  _anonClient = null;
  _adminClient = null;
}
