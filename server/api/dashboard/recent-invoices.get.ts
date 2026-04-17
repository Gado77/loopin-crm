export default defineEventHandler(async () => {
  try {
    const db = useDb()
    const { data: invoices } = await db.from('invoices').select('*').order('created_at', { ascending: false }).limit(5)
    
    return { success: true, data: invoices || [] }
  } catch (err) {
    throw createError({ statusCode: 500, message: 'Error' })
  }
})
