export default defineEventHandler(async () => {
  try {
    const db = useDb()
    const { data } = await db.from('invoices').select('*')
    return { success: true, data: data || [] }
  } catch (err) {
    throw createError({ statusCode: 500, message: 'Error' })
  }
})
