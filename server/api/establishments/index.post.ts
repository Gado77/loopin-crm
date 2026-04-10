import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.clientId || !body.name) {
    throw createError({
      statusCode: 400,
      message: 'Cliente e nome são obrigatórios',
    })
  }

  const db = useDb()
  const { data, error } = await db
    .from('establishments')
    .insert({
      id: generateId(),
      client_id: body.clientId,
      name: body.name,
      address: body.address || null,
      monthly_fee: body.monthlyFee || 0,
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
