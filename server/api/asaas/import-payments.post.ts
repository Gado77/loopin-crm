export default defineEventHandler(async (event) => {
  try {
    return { success: true, data: [] }
  } catch (err) {
    console.error('Error:', err)
    return createError({ statusCode: 500, message: 'Server error' })
  }
})
