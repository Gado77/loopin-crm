import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID é obrigatório',
    })
  }

  const db = useDb()
  const { error } = await db
    .from('establishments')
    .update({
      client_id: body.clientId,
      name: body.name,
      address: body.address || null,
      monthly_fee: body.monthlyFee || 0,
    })
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return { id, ...body }
})
