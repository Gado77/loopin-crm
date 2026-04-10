import { useDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  const labels: string[] = []
  const income: number[] = []
  const expenses: number[] = []

  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = date.toISOString().split('T')[0]
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    const monthEnd = nextMonth.toISOString().split('T')[0]

    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
    labels.push(monthName.charAt(0).toUpperCase() + monthName.slice(1))

    const incomeResult = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'income' AND date >= ? AND date < ?
    `).get(monthStart, monthEnd) as { total: number }

    const expenseResult = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'expense' AND date >= ? AND date < ?
    `).get(monthStart, monthEnd) as { total: number }

    income.push(incomeResult.total)
    expenses.push(expenseResult.total)
  }

  return { labels, income, expenses }
})
