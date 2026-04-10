import { useDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const invoices = db.prepare(`
    SELECT 
      i.id,
      i.amount,
      i.due_date as dueDate,
      c.name as clientName,
      e.name as establishmentName
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN establishments e ON i.establishment_id = e.id
    WHERE i.status = 'pending'
    AND i.due_date >= ?
    AND i.due_date <= ?
    ORDER BY i.due_date ASC
    LIMIT 5
  `).all(today, nextWeek)

  return invoices
})
