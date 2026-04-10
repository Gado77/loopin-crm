import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.clientId || !body.name) {
    throw createError({
      statusCode: 400,
      message: 'Cliente e nome são obrigatórios',
    })
  }

  const db = useDb()
  const id = `est-${Date.now()}`
  
  db.prepare(`
    INSERT INTO establishments (id, client_id, name, address, monthly_fee)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, body.clientId, body.name, body.address || null, body.monthlyFee || 0)

  return { id, ...body }
})
