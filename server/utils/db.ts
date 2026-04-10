import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { hashSync } from 'bcryptjs'

let supabase: SupabaseClient | null = null

export function useDb(): SupabaseClient {
  if (!supabase) {
    const config = useRuntimeConfig()
    const url = config.databaseUrl || process.env.DATABASE_URL || ''
    const key = config.databaseKey || process.env.DATABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    if (!url || !key) {
      throw new Error('DATABASE_URL and DATABASE_KEY environment variables are required')
    }
    
    supabase = createClient(url, key)
  }
  return supabase
}

export function generateId(): string {
  return crypto.randomUUID()
}
