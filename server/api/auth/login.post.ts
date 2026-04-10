import { useDb } from '../../utils/db'

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
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Credenciais inválidas',
    })
  }

  const { verifyPassword, createToken } = await import('../../utils/auth')
  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: 'Credenciais inválidas',
    })
  }

  const token = await createToken({
    id: user.id,
    email: user.email,
  })

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  }
})
