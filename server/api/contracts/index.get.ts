import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  try {
    const { data, error } = await db
      .from('contracts')
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Contracts API] Error:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('[Contracts API] Unexpected error:', err)
    return []
  }
})
