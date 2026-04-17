export default defineEventHandler(async () => {
  const db = useDb()
  
  const result = await db.from('contracts').select('*, clients(id, name, email)')
  
  if (result.error) {
    throw createError({ statusCode: 500, message: result.error.message })
  }

  return { success: true, data: result.data || [] }
})
