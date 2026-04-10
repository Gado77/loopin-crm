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

  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id)
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Fatura não encontrada',
    })
  }

  db.prepare(`
    UPDATE invoices 
    SET client_id = ?, establishment_id = ?, amount = ?, due_date = ?, status = ?, notes = ?
    WHERE id = ?
  `).run(
    body.clientId,
    body.establishmentId || null,
    body.amount,
    body.dueDate,
    body.status || 'pending',
    body.notes || null,
    id
  )

  return { id, ...body }
})
