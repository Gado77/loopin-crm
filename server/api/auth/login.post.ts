import { useDb } from '../../utils/db'
import { createToken } from '../../utils/auth'
import bcrypt from 'bcryptjs'

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

  // Bcrypt password comparison
  let isValid = false
  if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
    isValid = await bcrypt.compare(password, user.password_hash)
  } else {
    // Fallback if anyone registered manually without hashing
    isValid = user.password_hash === password
  }

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
