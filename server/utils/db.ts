import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Nao usar singleton em nivel de modulo — em ambientes serverless (Vercel)
// o processo pode ser reutilizado entre diferentes requisicoes/usuarios.
// useRuntimeConfig() e a forma correta de acessar env vars no Nitro.

export function useDb(): SupabaseClient {
  const config = useRuntimeConfig()

  const url = config.databaseUrl as string
  const key = config.databaseKey as string

  if (!url) {
    console.error('[DB] databaseUrl (DATABASE_URL) is not set!')
    throw createError({
      statusCode: 500,
      message: 'DATABASE_URL environment variable is not set',
    })
  }

  if (!key) {
    console.error('[DB] databaseKey (SUPABASE_SERVICE_ROLE_KEY) is not set!')
    throw createError({
      statusCode: 500,
      message: 'SUPABASE_SERVICE_ROLE_KEY environment variable is not set',
    })
  }

  return createClient(url, key)
}

export function generateId(): string {
  return crypto.randomUUID()
}
