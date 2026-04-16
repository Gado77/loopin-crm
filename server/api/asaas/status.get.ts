import { testarConexaoAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()

  // Teste de conexão com Asaas
  const { connected, account, error } = await testarConexaoAsaas()

  // Stats de clientes no CRM
  const { data: clientsData } = await db
    .from('clients')
    .select('id, asaas_customer_id')

  const all = clientsData || []
  const withAsaas = all.filter((c) => c.asaas_customer_id).length
  const withoutAsaas = all.filter((c) => !c.asaas_customer_id).length

  // Stats de faturas
  const { data: invoicesData } = await db
    .from('invoices')
    .select('id, status, asaas_payment_id')

  const invoices = invoicesData || []
  const pendingInvoices = invoices.filter((i) => i.status === 'pending').length
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue').length
  const withAsaasPayment = invoices.filter((i) => i.asaas_payment_id).length

  return {
    asaas: {
      connected,
      account: connected ? account : null,
      error: connected ? null : error
    },
    clients: {
      total: all.length,
      withAsaas,
      withoutAsaas
    },
    invoices: {
      total: invoices.length,
      pending: pendingInvoices,
      overdue: overdueInvoices,
      withAsaasPayment
    }
  }
})
