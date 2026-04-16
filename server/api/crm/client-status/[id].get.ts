import { useDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const clientId = getRouterParam(event, 'id')

  const crmApiKey = config.crmApiKey as string
  const authHeader = getHeader(event, 'authorization') || getHeader(event, 'x-api-key')

  if (!crmApiKey) {
    throw createError({
      statusCode: 500,
      message: 'CRM_API_KEY não configurada'
    })
  }

  if (authHeader !== `Bearer ${crmApiKey}` && authHeader !== crmApiKey) {
    throw createError({
      statusCode: 401,
      message: 'API Key inválida'
    })
  }

  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: 'clientId é obrigatório'
    })
  }

  const db = useDb()

  const { data: client, error } = await db
    .from('clients')
    .select(`
      id,
      name,
      status,
      grace_days,
      blocked_at,
      asaas_customer_id
    `)
    .eq('id', clientId)
    .single()

  if (error || !client) {
    throw createError({
      statusCode: 404,
      message: 'Cliente não encontrado'
    })
  }

  const graceDays = client.grace_days || 30
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - graceDays)
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

  const { data: overdueInvoices } = await db
    .from('invoices')
    .select('id, due_date, amount, status')
    .eq('client_id', clientId)
    .eq('status', 'overdue')
    .lt('due_date', cutoffDateStr)

  const hasInadimplencia = overdueInvoices && overdueInvoices.length > 0
  const canRunCampaigns = client.status === 'active' && !hasInadimplencia

  let reason: string | undefined
  if (!canRunCampaigns) {
    if (client.status !== 'active') {
      reason = `Cliente com status: ${client.status}`
    } else if (hasInadimplencia) {
      const oldest = overdueInvoices!.sort((a, b) => a.due_date.localeCompare(b.due_date))[0]
      reason = `Fatura vencida desde ${oldest.due_date} (grace_days: ${graceDays})`
    }
  }

  return {
    success: true,
    client: {
      id: client.id,
      name: client.name,
      canRunCampaigns,
      reason,
      status: client.status,
      blockedAt: client.blocked_at,
      since: hasInadimplencia ? overdueInvoices![0].due_date : null,
      overdueInvoicesCount: overdueInvoices?.length || 0
    }
  }
})
