import { useDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  const monthStart = new Date()
  monthStart.setDate(1)
  const start = monthStart.toISOString().split('T')[0]

  const expenses = db.prepare(`
    SELECT 
      COALESCE(ec.name, 'Sem categoria') as category,
      COALESCE(SUM(t.amount), 0) as amount
    FROM transactions t
    LEFT JOIN expense_categories ec ON t.category_id = ec.id
    WHERE t.type = 'expense'
    AND t.date >= ?
    GROUP BY ec.name
    ORDER BY amount DESC
    LIMIT 5
  `).all(start) as { category: string; amount: number }[]

  return expenses
})
