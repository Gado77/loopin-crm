export default defineEventHandler(async () => {
  try {
    return { success: true, message: 'Logged out' }
  } catch (err) {
    throw createError({ statusCode: 500, message: 'Error' })
  }
})
