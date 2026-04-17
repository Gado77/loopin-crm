export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const id = event.context.params.id
    
    const { data: client } = await db.from('clients').select('*').eq('id', id).single()
    
    if (!client) {
      throw createError({ statusCode: 404, message: 'Client not found' })
    }
    
    return { success: true, data: client }
  } catch (err) {
    throw err
  }
})
