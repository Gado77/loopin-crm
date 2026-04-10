import { SignJWT, jwtVerify } from 'jose'

const getSecret = () => {
  const secret = process.env.JWT_SECRET || 'loopin-crm-secret'
  return new TextEncoder().encode(secret)
}

export async function createToken(user: { id: string; email: string }): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<{ sub: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as { sub: string; email: string }
  } catch (e) {
    console.error('Token verification failed:', e)
    return null
  }
}
