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

  const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(id)
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Cliente não encontrado',
    })
  }

  db.prepare('DELETE FROM clients WHERE id = ?').run(id)

  return { success: true }
})
