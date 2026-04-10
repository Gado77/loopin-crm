import { useDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  
  const clients = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number }
  
  const pendingInvoices = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM invoices 
    WHERE status = 'pending'
  `).get() as { total: number }

  const overdueInvoices = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
    FROM invoices 
    WHERE status = 'overdue'
  `).get() as { count: number; total: number }

  const allInvoices = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
    FROM invoices 
    WHERE status IN ('pending', 'overdue')
  `).get() as { count: number; total: number }

  const overduePercentage = allInvoices.count > 0
    ? Math.round((overdueInvoices.count / allInvoices.count) * 100)
    : 0

  return {
    totalClients: clients.count,
    totalReceivable: pendingInvoices.total + overdueInvoices.total,
    overdueInvoices: overdueInvoices.count,
    overduePercentage,
  }
})
