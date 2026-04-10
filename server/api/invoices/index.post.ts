import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.clientId || !body.amount || !body.dueDate) {
    throw createError({
      statusCode: 400,
      message: 'Cliente, valor e data de vencimento são obrigatórios',
    })
  }

  const db = useDb()
  const { data, error } = await db
    .from('invoices')
    .insert({
      id: generateId(),
      client_id: body.clientId,
      amount: body.amount,
      due_date: body.dueDate,
      status: body.status || 'pending',
      paid_at: body.status === 'paid' ? new Date().toISOString() : null,
      payment_method: body.paymentMethod || null,
      notes: body.notes || null,
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
