import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.type || !body.description || !body.amount || !body.date) {
    throw createError({
      statusCode: 400,
      message: 'Tipo, descrição, valor e data são obrigatórios',
    })
  }

  const db = useDb()
  const id = `tx-${Date.now()}`
  
  db.prepare(`
    INSERT INTO transactions (id, type, category_id, description, amount, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.type,
    body.categoryId || null,
    body.description,
    body.amount,
    body.date
  )

  return { id, ...body }
})
