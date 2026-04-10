import { useDb } from '../../utils/db'

export default defineEventHandler((event) => {
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID é obrigatório',
    })
  }

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id)

  if (!client) {
    throw createError({
      statusCode: 404,
      message: 'Cliente não encontrado',
    })
  }

  const establishments = db.prepare(`
    SELECT * FROM establishments WHERE client_id = ? ORDER BY created_at DESC
  `).all(id)

  const invoices = db.prepare(`
    SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(id)

  return {
    ...client,
    establishments,
    invoices,
  }
})
