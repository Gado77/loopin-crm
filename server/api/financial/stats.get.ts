import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const { data: incomeData } = await db
    .from('transactions')
    .select('amount')
    .eq('type', 'income')
    .gte('date', monthStart)

  const { data: paidInvoicesData } = await db
    .from('invoices')
    .select('amount')
    .eq('status', 'paid')
    .gte('due_date', monthStart)

  const { data: expenseData } = await db
    .from('transactions')
    .select('amount')
    .eq('type', 'expense')
    .gte('date', monthStart)

  const baseIncome = incomeData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const invoiceIncome = paidInvoicesData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
  const monthIncome = baseIncome + invoiceIncome
  const monthExpenses = expenseData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

  return {
    monthIncome,
    monthExpenses,
    monthBalance: monthIncome - monthExpenses,
  }
})
