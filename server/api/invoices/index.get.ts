import { useDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  const invoices = db.prepare(`
    SELECT 
      i.*,
      c.name as clientName,
      e.name as establishmentName
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    LEFT JOIN establishments e ON i.establishment_id = e.id
    ORDER BY i.due_date ASC
  `).all()

  return invoices
})
