import { SignJWT } from 'jose'
import { compare, hashSync } from 'bcryptjs'
import { useDb } from '../utils/db'

const secret = new TextEncoder().encode('loopin-crm-secret-key-change-in-production')

export interface User {
  id: string
  email: string
  password_hash: string
  name: string
  created_at: Date
}

export function hashPassword(password: string): string {
  return hashSync(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash)
}

export async function createToken(user: { id: string; email: string }): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<{ sub: string; email: string } | null> {
  try {
    const { jwtVerify } = await import('jose')
    const { payload } = await jwtVerify(token, secret)
    return payload as { sub: string; email: string }
  } catch {
    return null
  }
}

export function getUserByEmail(email: string): User | undefined {
  const db = useDb()
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined
}

export function getUserById(id: string): User | undefined {
  const db = useDb()
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined
}
