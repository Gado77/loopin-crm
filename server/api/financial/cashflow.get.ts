import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  const labels: string[] = []
  const expenses: number[] = []

  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = date.toISOString().split('T')[0]
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    const monthEnd = nextMonth.toISOString().split('T')[0]

    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
    labels.push(monthName.charAt(0).toUpperCase() + monthName.slice(1))

    const { data: expenseData } = await db
      .from('transactions')
      .select('amount')
      .eq('type', 'expense')
      .gte('date', monthStart)
      .lt('date', monthEnd)

    expenses.push(expenseData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0)
  }

  return { labels, expenses }
})
