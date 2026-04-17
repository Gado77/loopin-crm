export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const id = event.context.params.id
    
    const { data } = await db.from('clients').delete().eq('id', id)
    
    return { success: true, message: 'Client deleted' }
  } catch (err) {
    throw createError({ statusCode: 500, message: 'Error deleting client' })
  }
})
