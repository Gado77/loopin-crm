import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: 'Nome é obrigatório',
    })
  }

  const db = useDb()
  const id = `client-${Date.now()}`
  
  db.prepare(`
    INSERT INTO clients (id, name, email, phone, document, address, grace_days)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, body.name, body.email || null, body.phone || null, body.document || null, body.address || null, body.graceDays || 30)

  return { id, ...body }
})
