export default defineEventHandler(async (event) => {
  try {
    return { success: true, message: 'Clients synced' }
  } catch (err) {
    console.error('Error:', err)
    return createError({ statusCode: 500, message: 'Server error' })
  }
})
