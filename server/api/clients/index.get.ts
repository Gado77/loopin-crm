import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  const { data: clients, error } = await db
    .from('clients')
    .select(`
      *,
      establishments_count:establishments(count),
      invoices_count:invoices(count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return clients?.map(c => ({
    ...c,
    establishments_count: c.establishments_count?.[0]?.count || 0,
    invoices_count: c.invoices_count?.[0]?.count || 0,
  })) || []
})
