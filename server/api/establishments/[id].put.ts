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

  const existing = db.prepare('SELECT * FROM establishments WHERE id = ?').get(id)
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Estabelecimento não encontrado',
    })
  }

  db.prepare(`
    UPDATE establishments 
    SET client_id = ?, name = ?, address = ?, monthly_fee = ?
    WHERE id = ?
  `).run(
    body.clientId,
    body.name,
    body.address || null,
    body.monthlyFee || 0,
    id
  )

  return { id, ...body }
})
