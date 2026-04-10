import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()

  const { count: totalClients } = await db
    .from('clients')
    .select('*', { count: 'exact', head: true })

  const { data: pendingData } = await db
    .from('invoices')
    .select('amount')
    .eq('status', 'pending')

  const { data: overdueData } = await db
    .from('invoices')
    .select('amount, status')

  const pendingInvoices = pendingData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
  const overdueInvoices = overdueData?.filter(i => i.status === 'overdue')
  const overdueCount = overdueInvoices?.length || 0
  const overdueTotal = overdueInvoices?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
  
  const allPending = overdueData?.filter(i => i.status === 'pending' || i.status === 'overdue') || []
  const overduePercentage = allPending.length > 0
    ? Math.round((overdueCount / allPending.length) * 100)
    : 0

  return {
    totalClients: totalClients || 0,
    totalReceivable: pendingInvoices + overdueTotal,
    overdueInvoices: overdueCount,
    overduePercentage,
  }
})
