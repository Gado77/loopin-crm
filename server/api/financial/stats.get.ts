import { useDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  const monthStart = new Date()
  monthStart.setDate(1)
  const start = monthStart.toISOString().split('T')[0]

  const income = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE type = 'income' AND date >= ?
  `).get(start) as { total: number }

  const expenses = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE type = 'expense' AND date >= ?
  `).get(start) as { total: number }

  return {
    monthIncome: income.total,
    monthExpenses: expenses.total,
    monthBalance: income.total - expenses.total,
  }
})
