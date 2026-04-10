import { useDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  const transactions = db.prepare(`
    SELECT 
      t.*,
      ec.name as categoryName
    FROM transactions t
    LEFT JOIN expense_categories ec ON t.category_id = ec.id
    ORDER BY t.date DESC
  `).all()

  return transactions
})
