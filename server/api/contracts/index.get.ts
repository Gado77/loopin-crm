import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
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
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return data
})
