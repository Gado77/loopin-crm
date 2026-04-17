import { useDb } from '../../utils/db'
import { listarCobrancasAsaas, mapearStatusAsaas } from '../../utils/asaas'

export default defineEventHandler(async () => {
  const db = useDb()
  
  try {
    const { data: localInvoices, error } = await db
      .from('invoices')
      .select(`
        *,
        client:clients(name)
      `)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('[Invoices API] Error:', error)
      return []
    }

    const localFormatted = (localInvoices || []).map((i: any) => ({
      ...i,
      clientName: i.client?.name,
      source: 'local',
    }))

    try {
      const { data: clients } = await db
        .from('clients')
        .select('id, name, asaas_customer_id')
        .not('asaas_customer_id', 'is', null)

      const clientMap = new Map<string, { id: string; name: string }>()
      for (const c of clients || []) {
        if (c.asaas_customer_id) {
          clientMap.set(c.asaas_customer_id, { id: c.id, name: c.name })
        }
      }

      const asaasInvoices: any[] = []
      for (const [asaasCustomerId, client] of clientMap) {
        try {
          const allPayments: any[] = []
          let offset = 0
          const limit = 100

          while (true) {
            const page = await listarCobrancasAsaas({
              customer: asaasCustomerId,
              limit,
              offset
            })
            const pageData = page.data || []
            allPayments.push(...pageData)

            if (!pageData.length || page.hasMore === false) break
            offset += limit
          }

          for (const payment of allPayments) {
            const localInvoice = (localInvoices || []).find(
              (i: any) => i.asaas_payment_id === payment.id
            )

            if (!localInvoice) {
              asaasInvoices.push({
                id: payment.id,
                client_id: client.id,
                clientName: client.name,
                amount: payment.value,
                due_date: payment.dueDate,
                status: mapearStatusAsaas(payment.status),
                payment_method: payment.billingType,
                paid_at: payment.paymentDate || null,
                notes: payment.description || 'Assinatura Loopin',
                asaas_payment_id: payment.id,
                asaas_billing_type: payment.billingType,
                contract_id: null,
                created_at: payment.dateCreated || new Date().toISOString(),
                source: 'asaas',
              })
            }
          }
        } catch (err: any) {
          console.error(`[Invoices API] Erro ao buscar cobranças do cliente ${client.name}:`, err.message)
        }
      }

      const allInvoices = [...asaasInvoices, ...localFormatted]
        .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())

      return allInvoices
    } catch (err: any) {
      console.error('[Invoices API] Erro ao buscar Asaas:', err.message)
      return localFormatted
    }
  } catch (err) {
    console.error('[Invoices API] Unexpected error:', err)
    return []
  }
})
