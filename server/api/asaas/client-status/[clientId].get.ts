import { useDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const clientId = getRouterParam(event, 'clientId')
  
  if (!clientId) {
    throw createError({ statusCode: 400, message: 'clientId é obrigatório' })
  }

  // Validação: Somente requisições autorizadas do Loopin.tv deveriam ter acesso
  // Podemos validar usando um CRM_API_KEY enviado via header
  const config = useRuntimeConfig()
  const apiKey = getHeader(event, 'authorization') || getHeader(event, 'x-api-key')
  
  if (config.crmApiKey && apiKey !== `Bearer ${config.crmApiKey}` && apiKey !== config.crmApiKey) {
    throw createError({ statusCode: 401, message: 'API Key inválida' })
  }

  const db = useDb()
  
  // 1. Verifica status atual do cliente no CRM
  const { data: client, error: clientError } = await db
    .from('clients')
    .select('id, name, status, grace_days')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    return {
      canRunCampaigns: false,
      reason: 'Cliente não encontrado',
    }
  }

  if (client.status !== 'active') {
    return {
      canRunCampaigns: false,
      reason: `Status atual do cliente é: ${client.status}`,
    }
  }

  // 2. Verifica se há faturas inadimplentes que passaram da tolerância
  const graceDays = client.grace_days || 30
  const today = new Date()
  today.setHours(today.getHours() - 3)
  
  const limitDate = new Date(today)
  limitDate.setDate(limitDate.getDate() - graceDays)
  const limitDateStr = limitDate.toISOString().split('T')[0]
  
  const { data: overdueInvoices, error: invError } = await db
    .from('invoices')
    .select('id, due_date')
    .eq('client_id', clientId)
    .eq('status', 'overdue')
    .lte('due_date', limitDateStr)
    
  if (invError) {
    return {
      canRunCampaigns: false,
      reason: 'Erro ao analisar histórico financeiro',
    }
  }

  if (overdueInvoices && overdueInvoices.length > 0) {
    return {
      canRunCampaigns: false,
      reason: `Possui ${overdueInvoices.length} fatura(s) com atraso superior a ${graceDays} dias`,
      since: overdueInvoices[0].due_date
    }
  }

  // Tudo certo!
  return {
    canRunCampaigns: true,
    reason: 'Cliente ativo e sem faturas inadimplentes vencidas',
  }
})
