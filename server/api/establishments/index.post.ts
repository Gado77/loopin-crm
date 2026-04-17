export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const db = useDb()
    
    const { data: establishment } = await db.from('establishments').insert({
      id: crypto.randomUUID(),
      name: body.name,
      address: body.address,
    }).select().single()
    
    return { success: true, data: establishment }
  } catch (err) {
    throw createError({ statusCode: 500, message: 'Error creating establishment' })
  }
})
