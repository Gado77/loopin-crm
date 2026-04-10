import { useDb } from '../../utils/db'
import { createToken } from '../../utils/auth'

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

  // Simple password comparison (for testing)
  const isValid = user.password_hash === password

  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: 'Credenciais inválidas',
    })
  }

  const token = await createToken({ id: user.id, email: user.email })

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  }
})
