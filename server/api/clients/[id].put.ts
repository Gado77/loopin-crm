import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID é obrigatório',
    })
  }

  const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(id)
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Cliente não encontrado',
    })
  }

  db.prepare(`
    UPDATE clients 
    SET name = ?, email = ?, phone = ?, document = ?, address = ?, grace_days = ?
    WHERE id = ?
  `).run(
    body.name,
    body.email || null,
    body.phone || null,
    body.document || null,
    body.address || null,
    body.graceDays || 30,
    id
  )

  return { id, ...body }
})
