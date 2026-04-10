import { useDb } from '../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  try {
    // Update admin password to plain text for testing
    const { error } = await db
      .from('users')
      .update({ password_hash: 'admin123' })
      .eq('email', 'admin@loopin.com')

    if (error) {
      return {
        success: false,
        message: 'Error updating password: ' + error.message
      }
    }

    return {
      success: true,
      message: 'Password reset successfully',
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
