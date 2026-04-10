import { useDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  const clients = db.prepare(`
    SELECT 
      c.*,
      (SELECT COUNT(*) FROM establishments WHERE client_id = c.id) as establishments_count,
      (SELECT COUNT(*) FROM invoices WHERE client_id = c.id) as invoices_count
    FROM clients c
    ORDER BY c.created_at DESC
  `).all()

  return clients
})
