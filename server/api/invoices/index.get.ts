import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  try {
    const { data, error } = await db
      .from('invoices')
      .select(`
        *,
        client:clients(name)
      `)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('[Invoices API] Error:', error)
      return []
    }

    return data?.map(i => ({
      ...i,
      clientName: i.client?.name,
    })) || []
  } catch (err) {
    console.error('[Invoices API] Unexpected error:', err)
    return []
  }
})
