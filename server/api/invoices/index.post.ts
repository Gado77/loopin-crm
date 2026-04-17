export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const db = useDb()
    
    if (!body.client_id || !body.amount) {
      throw createError({ statusCode: 400, message: 'Missing required fields' })
    }
    
    const { data: invoice } = await db.from('invoices').insert({
      id: crypto.randomUUID(),
      client_id: body.client_id,
      amount: body.amount,
      due_date: body.due_date,
      status: 'pending',
    }).select().single()
    
    return { success: true, data: invoice }
  } catch (err) {
    throw err
  }
})
