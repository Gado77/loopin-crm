export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const id = event.context.params.id
    
    await db.from('invoices').delete().eq('id', id)
    
    return { success: true, message: 'Invoice deleted' }
  } catch (err) {
    throw createError({ statusCode: 500, message: 'Error deleting invoice' })
  }
})
