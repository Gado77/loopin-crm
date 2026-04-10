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

  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id)
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Fatura não encontrada',
    })
  }

  const now = new Date().toISOString()

  db.prepare(`
    UPDATE invoices 
    SET status = 'paid', paid_at = ?
    WHERE id = ?
  `).run(now, id)

  return { success: true }
})
