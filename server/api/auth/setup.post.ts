import pkg from 'bcryptjs'
const { hashSync } = pkg
import { useDb, generateId } from '../../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  // Check if admin exists
  const { data: existing } = await db
    .from('users')
    .select('id')
    .eq('email', 'admin@loopin.com')
    .single()

  if (existing) {
    return { message: 'Admin already exists' }
  }

  // Create admin with password: admin123
  const passwordHash = hashSync('admin123', 12)
  
  const { data: newUser, error } = await db
    .from('users')
    .insert({
      id: generateId(),
      email: 'admin@loopin.com',
      password_hash: passwordHash,
      name: 'Administrador',
    })
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: 'Erro ao criar admin: ' + error.message,
    })
  }

  return {
    success: true,
    message: 'Admin created successfully',
    credentials: {
      email: 'admin@loopin.com',
      password: 'admin123',
    },
  }
})
