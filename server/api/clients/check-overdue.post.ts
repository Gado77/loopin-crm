import { useDb } from '../../utils/db'
import { notifyLoopinTv } from '../../utils/loopin-tv'

export default defineEventHandler(async (event) => {
  // O endpoint requer uma secret de segurança para que apenas o Cron dispare
  const config = useRuntimeConfig()
  const cronSecret = getHeader(event, 'x-cron-secret') || getQuery(event).secret
  
  // Em dev (sem config) passa direto, em prod valida
  if (config.cronSecret && cronSecret !== config.cronSecret) {
    throw createError({ statusCode: 401, message: 'Não autorizado' })
  }

  const db = useDb()
  
  // A function `check_client_overdue` retorna true se o cliente tem faturas vencidas 
  // que ultrapassaram o grace_days.
  
  // Busca todos os clientes ativos para checagem
  const { data: clients, error } = await db
    .from('clients')
    .select('id, name, status, grace_days')
    .eq('status', 'active')

  if (error) {
    throw createError({ statusCode: 500, message: `Erro ao buscar clientes: ${error.message}` })
  }

  const deactivatedClients = []
  
  for (const client of clients || []) {
    // Busca faturas em atraso deste cliente que passaram dos dias de tolerância
    // Obs: A function SQL check_client_overdue fará exatamente isso de forma mais performática,
    // mas também podemos fazer em JS para ter a lista exata.
    
    const graceDays = client.grace_days || 30
    
    // Calcula a data limite de tolerância: (Hoje - graceDays)
    const today = new Date()
    today.setHours(today.getHours() - 3) // BR Timezone
    
    const limitDate = new Date(today)
    limitDate.setDate(limitDate.getDate() - graceDays)
    const limitDateStr = limitDate.toISOString().split('T')[0]
    
    const { data: overdueInvoices, error: invError } = await db
      .from('invoices')
      .select('id, due_date')
      .eq('client_id', client.id)
      .eq('status', 'overdue')
      // Se venceu antes ou exatamente no dia limite
      .lte('due_date', limitDateStr)
      
    if (invError) {
      console.error(`Erro ao verificar faturas do cliente ${client.id}:`, invError.message)
      continue
    }

    if (overdueInvoices && overdueInvoices.length > 0) {
      console.log(`[Cron] Cliente ${client.name} será inativado! Faturas vencidas: ${overdueInvoices.length} (Tolerância: ${graceDays} dias / Limite: ${limitDateStr})`)
      
      // 1. Desativa no CRM
      await db
        .from('clients')
        .update({ status: 'overdue' })
        .eq('id', client.id)
        
      // 2. Notifica o Loopin.tv para pausar campanhas
      await notifyLoopinTv(client.id, 'pause')
      
      deactivatedClients.push({
        id: client.id,
        name: client.name,
        overdueCount: overdueInvoices.length
      })
    }
  }

  return {
    success: true,
    message: `Verificação concluída. ${deactivatedClients.length} clientes desativados.`,
    deactivated: deactivatedClients
  }
})
