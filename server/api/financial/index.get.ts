import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  const { data, error } = await db
    .from('transactions')
    .select(`
      *,
      category:expense_categories(name)
    `)
    .order('date', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return data?.map(t => ({
    ...t,
    categoryName: t.category?.name,
  })) || []
})
