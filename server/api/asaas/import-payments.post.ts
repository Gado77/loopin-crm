import { listarCobrancasAsaas, mapearStatusAsaas } from '../../utils/asaas'
import { useDb, generateId } from '../../utils/db'

/**
 * POST /api/asaas/import-payments
 *
 * Importa TODAS as cobranças do Asaas como faturas no CRM.
 * - Vincula automaticamente ao cliente pelo asaas_customer_id
 * - Pula cobranças que já existem no CRM (pelo asaas_payment_id)
 * - Pula cobranças cujo cliente não existe no CRM (ou cria se mode='create_clients')
 * - Pagina automaticamente até buscar todas as cobranças do Asaas
 */
export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event).catch(() => ({}))

  // Filtros opcionais
  const statusFilter = body.status || null       // ex: 'PENDING', 'CONFIRMED', null = todos
  const mode = body.mode || 'skip_unknown'       // 'skip_unknown' | 'create_clients'
  const dryRun = body.dryRun === true            // true = apenas simula, não insere

  console.log(`[import-payments] Iniciando... status=${statusFilter ?? 'TODOS'} mode=${mode} dryRun=${dryRun}`)

  // ─── Buscar TODOS os clientes do CRM indexados por asaas_customer_id ───────
  const { data: crmClients, error: crmError } = await db
    .from('clients')
    .select('id, name, email, asaas_customer_id')
    .not('asaas_customer_id', 'is', null)

  if (crmError) {
    throw createError({ statusCode: 500, message: 'Erro ao buscar clientes: ' + crmError.message })
  }

  const clientByAsaasId = new Map<string, { id: string; name: string }>()
  for (const c of crmClients || []) {
    if (c.asaas_customer_id) {
      clientByAsaasId.set(c.asaas_customer_id, { id: c.id, name: c.name })
    }
  }

  // ─── Buscar faturas já existentes no CRM (para evitar duplicatas) ──────────
  const { data: existingInvoices } = await db
    .from('invoices')
    .select('asaas_payment_id')
    .not('asaas_payment_id', 'is', null)

  const existingPaymentIds = new Set<string>(
    (existingInvoices || []).map((i: any) => i.asaas_payment_id)
  )

  // ─── Paginação: buscar TODAS as cobranças do Asaas ────────────────────────
  const allPayments: any[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const params: any = { limit, offset }
    if (statusFilter) params.status = statusFilter

    const page = await listarCobrancasAsaas(params)
    allPayments.push(...(page.data || []))

    console.log(`[import-payments] Página offset=${offset}: ${page.data?.length ?? 0} cobranças (total até agora: ${allPayments.length})`)

    if (!page.hasMore || (page.data?.length ?? 0) === 0) break
    offset += limit
  }

  console.log(`[import-payments] Total encontrado no Asaas: ${allPayments.length}`)

  // ─── Processar cada cobrança ───────────────────────────────────────────────
  const imported: string[] = []
  const skippedExists: string[] = []
  const skippedNoClient: string[] = []
  const errors: string[] = []

  for (const payment of allPayments) {
    const paymentLabel = `${payment.id} (R$ ${payment.value} — ${payment.billingType})`

    // Já existe no CRM?
    if (existingPaymentIds.has(payment.id)) {
      skippedExists.push(paymentLabel)
      continue
    }

    // Encontrar o cliente no CRM
    let clientId: string | null = null
    let clientName = '?'

    if (payment.customer) {
      const found = clientByAsaasId.get(payment.customer)
      if (found) {
        clientId = found.id
        clientName = found.name
      }
    }

    // Cliente não encontrado no CRM
    if (!clientId) {
      skippedNoClient.push(`${paymentLabel} — customer_asaas: ${payment.customer}`)
      console.warn(`[import-payments] Cliente Asaas não encontrado no CRM: ${payment.customer}`)
      continue
    }

    // Mapear status
    const crmStatus = mapearStatusAsaas(payment.status)

    // Montar o registro da fatura
    const invoiceData = {
      id: generateId(),
      client_id: clientId,
      amount: payment.value,
      due_date: payment.dueDate,
      status: crmStatus,
      paid_at: (crmStatus === 'paid') ? payment.confirmedDate || payment.paymentDate || new Date().toISOString() : null,
      payment_method: payment.billingType,
      notes: payment.description || null,
      asaas_payment_id: payment.id,
      asaas_billing_type: payment.billingType,
      created_at: payment.dateCreated || new Date().toISOString(),
    }

    if (dryRun) {
      imported.push(`[DRY RUN] ${clientName} — ${paymentLabel} → ${crmStatus}`)
      continue
    }

    const { error: insertError } = await db.from('invoices').insert(invoiceData)

    if (insertError) {
      errors.push(`${paymentLabel}: ${insertError.message}`)
      console.error(`[import-payments] Erro ao inserir ${payment.id}:`, insertError.message)
    } else {
      imported.push(`${clientName} — R$ ${payment.value} (${crmStatus})`)
      console.log(`[import-payments] ✓ Importado: ${payment.id} → cliente "${clientName}"`)
    }
  }

  console.log(`[import-payments] Concluído: ${imported.length} importados, ${skippedExists.length} já existiam, ${skippedNoClient.length} sem cliente, ${errors.length} erros`)

  return {
    success: true,
    dryRun,
    message: dryRun
      ? `Simulação: ${imported.length} seriam importadas`
      : `Importação concluída! ${imported.length} fatura(s) importada(s) do Asaas.`,
    counts: {
      total: allPayments.length,
      imported: imported.length,
      skippedExists: skippedExists.length,
      skippedNoClient: skippedNoClient.length,
      errors: errors.length,
    },
    details: {
      imported,
      skippedExists,
      skippedNoClient,
      errors
    }
  }
})
