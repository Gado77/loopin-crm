import { listarAssinaturasAsaas, listarCobrancasAsaas, mapearStatusAsaas } from '../../utils/asaas'
import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const db = useDb()

  const cronSecret = config.cronSecret as string
  const authHeader = getHeader(event, 'authorization') || getHeader(event, 'x-cron-secret')

  if (!cronSecret) {
    throw createError({ statusCode: 500, message: 'CRON_SECRET não configurada' })
  }

  if (authHeader !== `Bearer ${cronSecret}` && authHeader !== cronSecret) {
    throw createError({ statusCode: 401, message: 'Acesso não autorizado' })
  }

  console.log('[import-subscription-payments] Iniciando importação...')

  let imported = 0
  let skipped = 0
  let errors = 0
  const details: string[] = []

  try {
    const allSubscriptions: any[] = []
    let offset = 0
    const limit = 100

    while (true) {
      const page = await listarAssinaturasAsaas({ limit, offset, status: 'ACTIVE' })
      const pageData = page.data || []
      allSubscriptions.push(...pageData)

      if (!pageData.length || page.hasMore === false) break
      offset += limit
    }

    console.log(`[import-subscription-payments] Encontradas ${allSubscriptions.length} assinaturas ativas`)

    for (const subscription of allSubscriptions) {
      try {
        const client = await db
          .from('clients')
          .select('id, name, asaas_customer_id')
          .eq('asaas_customer_id', subscription.customer)
          .single()

        if (!client.data) {
          console.log(`[import-subscription-payments] Cliente não encontrado para assinatura ${subscription.id}`)
          skipped++
          continue
        }

        const allPayments: any[] = []
        let pOffset = 0
        const pLimit = 100

        while (true) {
          const page = await listarCobrancasAsaas({
            customer: subscription.customer,
            limit: pLimit,
            offset: pOffset
          })
          const pageData = page.data || []
          allPayments.push(...pageData)

          if (!pageData.length || page.hasMore === false) break
          pOffset += pLimit
        }

        for (const payment of allPayments) {
          const existingInvoice = await db
            .from('invoices')
            .select('id')
            .eq('asaas_payment_id', payment.id)
            .single()

          if (existingInvoice.data) {
            skipped++
            continue
          }

          const invoiceId = generateId()
          const crmStatus = mapearStatusAsaas(payment.status)

          const { error } = await db.from('invoices').insert({
            id: invoiceId,
            client_id: client.data.id,
            amount: payment.value,
            due_date: payment.dueDate,
            status: crmStatus,
            paid_at: crmStatus === 'paid' ? (payment.paymentDate || new Date().toISOString()) : null,
            payment_method: payment.billingType,
            notes: `Assinatura: ${subscription.description || 'Loopin'}`,
            asaas_payment_id: payment.id,
            asaas_billing_type: payment.billingType,
            contract_id: null,
            created_at: payment.dateCreated || new Date().toISOString()
          })

          if (error) {
            errors++
            console.error(`[import-subscription-payments] Erro ao criar fatura:`, error)
          } else {
            imported++
            details.push(`${client.data.name} - R$ ${payment.value} - ${payment.dueDate} (${crmStatus})`)
          }
        }
      } catch (err: any) {
        errors++
        console.error(`[import-subscription-payments] Erro na assinatura ${subscription.id}:`, err.message)
      }
    }

    console.log(`[import-subscription-payments] Concluído: ${imported} importadas, ${skipped} puladas, ${errors} erros`)

    return {
      success: true,
      message: `Importação concluída! ${imported} faturas importadas das assinaturas.`,
      imported,
      skipped,
      errors,
      details: details.slice(0, 50)
    }
  } catch (err: any) {
    console.error('[import-subscription-payments] Erro geral:', err)
    throw createError({ statusCode: 500, message: err.message })
  }
})
