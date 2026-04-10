import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  const { data: clients, error } = await db
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }
  return clients || []
})
