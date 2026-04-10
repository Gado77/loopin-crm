export default defineEventHandler(async (event) => {
  const { verifyToken } = await import('../../utils/auth')
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Token não fornecido',
    })
  }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token)

  if (!payload) {
    throw createError({
      statusCode: 401,
      message: 'Token inválido',
    })
  }

  return {
    id: payload.sub,
    email: payload.email,
  }
})
