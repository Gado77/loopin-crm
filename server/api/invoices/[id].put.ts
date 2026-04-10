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
    .from('invoices')
    .update({
      client_id: body.clientId,
      establishment_id: body.establishmentId || null,
      amount: body.amount,
      due_date: body.dueDate,
      status: body.status || 'pending',
      notes: body.notes || null,
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
