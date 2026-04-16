import { useDb } from '../../utils/db'
import { notifyLoopinTv } from '../../utils/loopin-tv'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const cronSecret = config.cronSecret as string
  const authHeader = getHeader(event, 'authorization') || getHeader(event, 'x-cron-secret')

  if (!cronSecret) {
    throw createError({
      statusCode: 500,
      message: 'CRON_SECRET não configurada'
    })
  }

  if (authHeader !== `Bearer ${cronSecret}` && authHeader !== cronSecret) {
    throw createError({
      statusCode: 401,
      message: 'Acesso não autorizado'
    })
  }

  const db = useDb()
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  console.log(`[check-overdue] Iniciando verificação em ${hoje.toISOString()}`)

  const { data: clients } = await db
    .from('clients')
    .select('id, name, grace_days, status')
    .in('status', ['active', 'inactive'])

  if (!clients || clients.length === 0) {
    return { success: true, message: 'Nenhum cliente para verificar', blocked: 0, reactivated: 0 }
  }

  let blockedCount = 0
  let reactivatedCount = 0
  const blockedClients: string[] = []
  const reactivatedClients: string[] = []
  const errors: string[] = []

  for (const client of clients) {
    try {
      const graceDays = client.grace_days || 30
      const cutoffDate = new Date(hoje)
      cutoffDate.setDate(cutoffDate.getDate() - graceDays)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      const { data: overdueInvoices } = await db
        .from('invoices')
        .select('id, due_date')
        .eq('client_id', client.id)
        .eq('status', 'overdue')
        .lt('due_date', cutoffDateStr)

      const hasInadimplencia = overdueInvoices && overdueInvoices.length > 0

      if (hasInadimplencia && client.status === 'active') {
        await db
          .from('clients')
          .update({
            status: 'inactive',
            blocked_at: new Date().toISOString()
          })
          .eq('id', client.id)

        blockedClients.push(client.name)
        blockedCount++

        try {
          await notifyLoopinTv(client.id, 'pause')
        } catch (notifyErr: any) {
          console.error(`[check-overdue] Erro ao notificar Loopin.tv para ${client.name}:`, notifyErr.message)
        }

        console.log(`[check-overdue] Cliente ${client.name} bloqueado (${overdueInvoices.length} faturas inadimplentes)`)
      }
      else if (!hasInadimplencia && client.status === 'inactive') {
        const { data: pendingInvoices } = await db
          .from('invoices')
          .select('id')
          .eq('client_id', client.id)
          .in('status', ['pending', 'overdue'])

        if (!pendingInvoices || pendingInvoices.length === 0) {
          await db
            .from('clients')
            .update({
              status: 'active',
              blocked_at: null
            })
            .eq('id', client.id)

          reactivatedClients.push(client.name)
          reactivatedCount++

          try {
            await notifyLoopinTv(client.id, 'activate')
          } catch (notifyErr: any) {
            console.error(`[check-overdue] Erro ao notificar Loopin.tv para ${client.name}:`, notifyErr.message)
          }

          console.log(`[check-overdue] Cliente ${client.name} reativado`)
        }
      }
    } catch (err: any) {
      errors.push(`${client.name}: ${err.message}`)
      console.error(`[check-overdue] Erro ao processar ${client.name}:`, err.message)
    }
  }

  console.log(`[check-overdue] Concluído: ${blockedCount} bloqueados, ${reactivatedCount} reativados, ${errors.length} erros`)

  return {
    success: true,
    message: `Verificação concluída`,
    timestamp: new Date().toISOString(),
    stats: {
      total: clients.length,
      blocked: blockedCount,
      reactivated: reactivatedCount,
      errors: errors.length
    },
    details: {
      blockedClients,
      reactivatedClients,
      errors
    }
  }
})
