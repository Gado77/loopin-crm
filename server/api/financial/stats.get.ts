import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const { data: expenseData } = await db
    .from('transactions')
    .select('amount')
    .eq('type', 'expense')
    .gte('date', monthStart)

  const { data: totalExpenseData } = await db
    .from('transactions')
    .select('amount')
    .eq('type', 'expense')

  const monthExpenses = expenseData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const totalExpenses = totalExpenseData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

  return {
    monthExpenses,
    totalExpenses,
  }
})
