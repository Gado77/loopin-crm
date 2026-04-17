export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const db = useDb()
    
    if (!body.client_id || !body.monthly_value) {
      throw createError({ statusCode: 400, message: 'Missing required fields' })
    }
    
    const { data: contract } = await db.from('contracts').insert({
      id: crypto.randomUUID(),
      client_id: body.client_id,
      name: body.name,
      start_date: body.start_date,
      monthly_value: body.monthly_value,
      total_months: body.total_months,
      status: 'active',
    }).select().single()
    
    return { success: true, data: contract }
  } catch (err) {
    throw err
  }
})
