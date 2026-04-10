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

  const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Transação não encontrada',
    })
  }

  db.prepare(`
    UPDATE transactions 
    SET type = ?, category_id = ?, description = ?, amount = ?, date = ?
    WHERE id = ?
  `).run(
    body.type,
    body.categoryId || null,
    body.description,
    body.amount,
    body.date,
    id
  )

  return { id, ...body }
})
