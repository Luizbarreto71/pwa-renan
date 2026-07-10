import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from '@/lib/supabase/config'

export function createClient() {
  const { url, anonKey } = getSupabaseEnv()

  if (!url || !anonKey) {
    return null as never
  }

  return createBrowserClient(url, anonKey)
}