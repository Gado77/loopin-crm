export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const db = useDb()
    const { email, password } = body
    
    if (!email || !password) {
      throw createError({ statusCode: 400, message: 'Email and password required' })
    }
    
    const { data: user } = await db.from('users').select('*').eq('email', email).single()
    
    if (!user) {
      throw createError({ statusCode: 401, message: 'Invalid credentials' })
    }
    
    const token = await createToken({ id: user.id, email: user.email })
    
    return { 
      success: true, 
      token,
      user: { id: user.id, email: user.email, name: user.name } 
    }
  } catch (err) {
    console.error('Login error:', err)
    throw err
  }
})
