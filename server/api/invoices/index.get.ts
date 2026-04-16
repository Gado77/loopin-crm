import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  const { data, error } = await db
    .from('invoices')
    .select(`
      *,
      client:clients(name)
    `)
    .order('due_date', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return data?.map(i => ({
    ...i,
    clientName: i.client?.name,
  })) || []
})
