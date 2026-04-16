import { listarAssinaturasAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)
  const sync = query.sync === 'true'

  if (sync) {
    const allSubscriptions: any[] = []
    let offset = 0
    const limit = 100

    while (true) {
      const page = await listarAssinaturasAsaas({ limit, offset })
      const pageData = page.data || []
      allSubscriptions.push(...pageData)

      if (!pageData.length) break
      if (page.hasMore === false) break
      if (pageData.length < limit) break
      offset += limit
    }

    let imported = 0
    let skipped = 0

    for (const sub of allSubscriptions) {
      const { data: existing } = await db
        .from('asaas_subscriptions')
        .select('id')
        .eq('asaas_id', sub.id)
        .single()

      if (existing) {
        await db
          .from('asaas_subscriptions')
          .update({
            description: sub.description,
            value: sub.value,
            cycle: sub.cycle,
            billing_type: sub.billingType,
            next_due_date: sub.nextDueDate,
            status: sub.status,
            installments: sub.installments,
            last_payment_date: sub.lastPaymentDate,
            updated_at: new Date().toISOString(),
          })
          .eq('asaas_id', sub.id)
        skipped++
      } else {
        const clientId = await findClientIdByAsaasCustomer(sub.customer)

        await db
          .from('asaas_subscriptions')
          .insert({
            asaas_id: sub.id,
            client_id: clientId,
            description: sub.description,
            value: sub.value,
            cycle: sub.cycle,
            billing_type: sub.billingType,
            next_due_date: sub.nextDueDate,
            status: sub.status,
            installments: sub.installments,
            last_payment_date: sub.lastPaymentDate,
            external_reference: sub.customer,
          })
        imported++
      }
    }

    return {
      success: true,
      message: `Sincronizado! ${imported} novas, ${skipped} atualizadas`,
      imported,
      skipped,
      total: allSubscriptions.length,
    }
  }

  const { data: subscriptions, error } = await db
    .from('asaas_subscriptions')
    .select(`
      *,
      clients:client_id (
        id,
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return {
    success: true,
    subscriptions: subscriptions || [],
    counts: {
      total: subscriptions?.length || 0,
      active: subscriptions?.filter(s => s.status === 'ACTIVE').length || 0,
      inactive: subscriptions?.filter(s => s.status !== 'ACTIVE').length || 0,
    },
  }
})

async function findClientIdByAsaasCustomer(asaasCustomerId: string): Promise<string | null> {
  const db = useDb()
  const { data } = await db
    .from('clients')
    .select('id')
    .eq('asaas_customer_id', asaasCustomerId)
    .single()
  return data?.id || null
}
