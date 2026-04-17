import { listarAssinaturasAsaas } from '../../utils/asaas'
import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()

    const assinaturas = await listarAssinaturasAsaas({ limit: 100 })

    const { data: existentes } = await db.from('contracts').select('*')

    const novas = assinaturas.data.filter(a => !existentes?.some(e => e.notes?.includes(a.id)))

    for (const assinatura of novas) {
      const { data: client } = await db.from('clients').select('*').eq('asaas_customer_id', assinatura.customer).single()

      if (client) {
        await db.from('contracts').insert({
          id: generateId(),
          client_id: client.id,
          name: assinatura.description || 'Synchronized Subscription',
          start_date: assinatura.nextDueDate,
          monthly_value: assinatura.value,
          status: assinatura.status.toLowerCase(),
          notes: `Asaas Subscription ID: ${assinatura.id}`,
        })
      }
    }

    return {
      success: true,
      imported: novas.length,
      message: `${novas.length} subscriptions synchronized`,
    }
  } catch (err) {
    console.error('[subscriptions] Error:', err)
    throw err
  }
})
