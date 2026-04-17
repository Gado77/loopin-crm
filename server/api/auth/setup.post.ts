export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const db = useDb()
    
    const { data: existingUser } = await db.from('users').select('*').limit(1).single()
    
    if (existingUser) {
      throw createError({ statusCode: 400, message: 'Setup already completed' })
    }
    
    const { data: user } = await db.from('users').insert({
      email: body.email,
      name: body.name,
      password: body.password,
    }).select().single()
    
    return { success: true, user }
  } catch (err) {
    throw err
  }
})
