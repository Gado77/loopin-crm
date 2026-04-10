import { useDb, generateId } from '../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  try {
    // Check if admin exists
    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('email', 'admin@loopin.com')
      .single()

    if (existing) {
      return { 
        success: false,
        message: 'Admin already exists',
        credentials: {
          email: 'admin@loopin.com',
          password: 'admin123'
        }
      }
    }

    // Create admin
    const { data: newUser, error } = await db
      .from('users')
      .insert({
        id: generateId(),
        email: 'admin@loopin.com',
        password_hash: 'admin123',
        name: 'Administrador',
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        message: 'Error creating admin: ' + error.message
      }
    }

    return {
      success: true,
      message: 'Admin created successfully',
      credentials: {
        email: 'admin@loopin.com',
        password: 'admin123'
      }
    }
  } catch (e: any) {
    return {
      success: false,
      message: 'Error: ' + e.message
    }
  }
})
