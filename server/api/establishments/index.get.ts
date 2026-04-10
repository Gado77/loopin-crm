import { useDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  const establishments = db.prepare(`
    SELECT 
      e.*,
      c.name as clientName
    FROM establishments e
    LEFT JOIN clients c ON e.client_id = c.id
    ORDER BY e.created_at DESC
  `).all()

  return establishments
})
