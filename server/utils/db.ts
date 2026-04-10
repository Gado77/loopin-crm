import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

export function useDb(): SupabaseClient {
  if (!supabase) {
    const url = process.env.DATABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DATABASE_KEY
    
    if (!url || !key) {
      console.error('Missing env vars:', { url: !!url, key: !!key })
      throw new Error('Database configuration missing. Please check environment variables.')
    }
    
    supabase = createClient(url, key)
  }
  return supabase
}

export function generateId(): string {
  return crypto.randomUUID()
}
