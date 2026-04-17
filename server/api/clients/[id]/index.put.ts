export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const id = event.context.params.id
    const body = await readBody(event)
    
    const { data: client } = await db.from('clients').update(body).eq('id', id).select().single()
    
    if (!client) {
      throw createError({ statusCode: 404, message: 'Client not found' })
    }
    
    return { success: true, data: client }
  } catch (err) {
    throw err
  }
})
