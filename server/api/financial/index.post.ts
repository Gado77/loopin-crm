import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.categoryId || !body.description || !body.amount || !body.date) {
    throw createError({
      statusCode: 400,
      message: 'Categoria, descrição, valor e data são obrigatórios',
    })
  }

  const db = useDb()
  const { data, error } = await db
    .from('transactions')
    .insert({
      id: generateId(),
      type: 'expense',
      category_id: body.categoryId,
      description: body.description,
      amount: body.amount,
      date: body.date,
    })
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return data
})
