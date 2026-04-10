import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  console.log('[Login] Request received')
  
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email e senha são obrigatórios',
    })
  }

  console.log('[Login] Attempting login for:', email)
  
  const db = useDb()
  console.log('[Login] Database connected')
  
  const { data: user, error } = await db
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('[Login] User not found or error:', error)
    throw createError({
      statusCode: 401,
      message: 'Credenciais inválidas',
    })
  }

  console.log('[Login] User found:', user.id)

  const { compare } = await import('bcryptjs')
  const isValid = await compare(password, user.password_hash)

  if (!isValid) {
    console.log('[Login] Invalid password')
    throw createError({
      statusCode: 401,
      message: 'Credenciais inválidas',
    })
  }

  console.log('[Login] Password valid, generating token')

  const { SignJWT } = await import('jose')
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'loopin-crm-secret')
  const token = await new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  console.log('[Login] Success!')
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  }
})
