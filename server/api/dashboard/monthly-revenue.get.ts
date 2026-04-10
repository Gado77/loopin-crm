import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
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

    const { data: paidData } = await db
      .from('invoices')
      .select('amount')
      .eq('status', 'paid')
      .gte('due_date', monthStart)
      .lt('due_date', monthEnd)

    data.push(paidData?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0)
  }

  return { labels: months, data }
})
