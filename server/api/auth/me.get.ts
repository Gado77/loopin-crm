export default defineEventHandler(async () => {
  try {
    return { success: true, user: null }
  } catch (err) {
    throw createError({ statusCode: 500, message: 'Error' })
  }
})
