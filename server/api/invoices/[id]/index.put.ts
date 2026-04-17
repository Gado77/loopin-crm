export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const id = event.context.params.id
    const body = await readBody(event)
    
    const { data: invoice } = await db.from('invoices').update(body).eq('id', id).select().single()
    
    if (!invoice) {
      throw createError({ statusCode: 404, message: 'Invoice not found' })
    }
    
    return { success: true, data: invoice }
  } catch (err) {
    throw err
  }
})
