import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

export function useDb(): SupabaseClient {
  if (!supabase) {
    const url = process.env.DATABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('[DB] Initializing Supabase client')
    console.log('[DB] URL configured:', !!url, 'Key configured:', !!key)
    
    if (!url) {
      console.error('[DB] DATABASE_URL is not set!')
      throw createError({
        statusCode: 500,
        message: 'DATABASE_URL environment variable is not set'
      })
    }
    
    if (!key) {
      console.error('[DB] SUPABASE_SERVICE_ROLE_KEY is not set!')
      throw createError({
        statusCode: 500,
        message: 'SUPABASE_SERVICE_ROLE_KEY environment variable is not set'
      })
    }
    
    supabase = createClient(url, key)
    console.log('[DB] Supabase client initialized successfully')
  }
  return supabase
}

export function generateId(): string {
  return crypto.randomUUID()
}
