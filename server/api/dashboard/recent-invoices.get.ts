import { useDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  const invoices = db.prepare(`
    SELECT 
      i.id,
      i.amount,
      i.due_date as dueDate,
      i.status,
      c.name as clientName,
      e.name as establishmentName
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN establishments e ON i.establishment_id = e.id
    ORDER BY i.created_at DESC
    LIMIT 10
  `).all()

  return invoices
})
