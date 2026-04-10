import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.type || !body.description || !body.amount || !body.date) {
    throw createError({
      statusCode: 400,
      message: 'Tipo, descrição, valor e data são obrigatórios',
    })
  }

  const db = useDb()
  const { data, error } = await db
    .from('transactions')
    .insert({
      id: generateId(),
      type: body.type,
      category_id: body.categoryId || null,
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
