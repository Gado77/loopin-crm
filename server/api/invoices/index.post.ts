import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.clientId || !body.amount || !body.dueDate) {
    throw createError({
      statusCode: 400,
      message: 'Cliente, valor e data de vencimento são obrigatórios',
    })
  }

  const db = useDb()
  const id = `inv-${Date.now()}`
  
  db.prepare(`
    INSERT INTO invoices (id, client_id, establishment_id, amount, due_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.clientId,
    body.establishmentId || null,
    body.amount,
    body.dueDate,
    body.status || 'pending',
    body.notes || null
  )

  return { id, ...body }
})
