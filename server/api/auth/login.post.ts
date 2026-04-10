import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email e senha são obrigatórios',
    })
  }

  const db = useDb()
  const { data: user, error } = await db
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) {
    throw createError({
      statusCode: 401,
      message: 'Credenciais inválidas',
    })
  }

  const { compare } = await import('bcryptjs')
  const isValid = await compare(password, user.password_hash)

  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: 'Credenciais inválidas',
    })
  }

  const { SignJWT } = await import('jose')
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'loopin-crm-secret')
  const token = await new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  }
})
