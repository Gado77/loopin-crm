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

  const existing = db.prepare('SELECT * FROM establishments WHERE id = ?').get(id)
  if (!existing) {
    throw createError({
      statusCode: 404,
      message: 'Estabelecimento não encontrado',
    })
  }

  db.prepare('DELETE FROM establishments WHERE id = ?').run(id)

  return { success: true }
})
