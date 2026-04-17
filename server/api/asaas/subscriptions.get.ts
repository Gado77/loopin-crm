export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const { data: contracts } = await db.from('contracts').select('*')
    return { success: true, data: contracts || [] }
  } catch (err) {
    console.error('Error:', err)
    return createError({ statusCode: 500, message: 'Server error' })
  }
})
