import { useDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  const months: string[] = []
  const data: number[] = []

  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = date.toISOString().split('T')[0]
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    const monthEnd = nextMonth.toISOString().split('T')[0]

    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
    months.push(monthName.charAt(0).toUpperCase() + monthName.slice(1))

    const result = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM invoices
      WHERE status = 'paid'
      AND paid_at >= ? AND paid_at < ?
    `).get(monthStart, monthEnd) as { total: number }

    data.push(result.total)
  }

  return { labels: months, data }
})
