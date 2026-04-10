import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  const { data, error } = await db
    .from('expense_categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return data || []
})
