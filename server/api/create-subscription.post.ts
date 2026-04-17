export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDb()
  
  if (!body.clientId || !body.value || !body.nextDueDate) {
    throw createError({ statusCode: 400, message: 'Missing fields' })
  }

  const client = await db.from('clients').select('*').eq('id', body.clientId).single()
  if (!client.data) {
    throw createError({ statusCode: 404, message: 'Client not found' })
  }

  const result = await db.from('contracts').insert({
    id: crypto.randomUUID(),
    client_id: body.clientId,
    name: body.description || 'Subscription',
    start_date: body.nextDueDate,
    monthly_value: body.value,
    total_months: body.installments || null,
    status: 'active',
  }).select().single()

  if (result.error) {
    throw createError({ statusCode: 500, message: result.error.message })
  }

  return { success: true, data: result.data }
})
