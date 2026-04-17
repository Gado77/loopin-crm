export default defineEventHandler(async () => {
  try {
    const db = useDb()
    const { data: invoices } = await db.from('invoices').select('*')
    
    return {
      success: true,
      data: {
        total: invoices?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0,
      }
    }
  } catch (err) {
    throw createError({ statusCode: 500, message: 'Error' })
  }
})
