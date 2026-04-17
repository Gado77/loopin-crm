export default defineEventHandler(async (event) => {
  try {
    const { data } = await useDb().from('invoices').select('*')
    return { success: true, data }
  } catch (err) {
    console.error('Error:', err)
    return createError({ statusCode: 500, message: 'Server error' })
  }
})
