import { mapearStatusAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // ─── Validação de assinatura do webhook (opcional mas recomendado) ──────────
  const webhookSecret = config.asaasWebhookSecret as string | undefined
  if (webhookSecret) {
    const signatureHeader = getHeader(event, 'asaas-access-token') || getHeader(event, 'asaas-webhook-token')
    if (!signatureHeader || signatureHeader !== webhookSecret) {
      throw createError({ statusCode: 401, message: 'Webhook token inválido' })
    }
  }

  const eventType = body.event as string

  console.log('[Webhook Asaas]', eventType, body.payment?.id)

  // ─── Pagamento confirmado / recebido ──────────────────────────────────────
  if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
    const paymentData = body.payment

    if (paymentData?.externalReference) {
      const { data: invoice, error } = await db
        .from('invoices')
        .select('id, status, client_id')
        .eq('id', paymentData.externalReference)
        .single()

      if (!error && invoice && invoice.status !== 'paid') {
        // Atualiza a fatura
        await db
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: paymentData.billingType
          })
          .eq('id', invoice.id)
          
        console.log(`[Webhook] Fatura ${invoice.id} marcada como paga via ${paymentData.billingType}`)

        // Se encontrou o cliente vinculado, atualiza status dele para ativo
        if (invoice.client_id) {
          const { error: clientError } = await db
            .from('clients')
            .update({ status: 'active' })
            .eq('id', invoice.client_id)
            
          if (!clientError) {
            console.log(`[Webhook] Cliente ${invoice.client_id} ativado após pagamento!`)
            // Notifica o Loopin.tv para ativar as campanhas
            const { notifyLoopinTv } = await import('../../utils/loopin-tv')
            await notifyLoopinTv(invoice.client_id, 'activate')
          }
        }
      }
    }
  }

  // ─── Pagamento atualizado (status genérico) ───────────────────────────────
  if (eventType === 'PAYMENT_UPDATED') {
    const paymentData = body.payment
    const newStatus = mapearStatusAsaas(paymentData.status)

    if (paymentData?.externalReference && newStatus !== 'paid') {
      const updateData: Record<string, string> = { status: newStatus }
      if (newStatus === 'cancelled') {
        // Limpa o vínculo com Asaas quando cancelado para permitir nova cobrança
        // (não limpa asaas_payment_id para manter histórico)
      }

      await db
        .from('invoices')
        .update(updateData)
        .eq('id', paymentData.externalReference)

      console.log(`[Webhook] Fatura ${paymentData.externalReference} → status: ${newStatus}`)
    }
  }

  // ─── Pagamento vencido ────────────────────────────────────────────────────
  if (eventType === 'PAYMENT_OVERDUE') {
    const paymentData = body.payment

    if (paymentData?.externalReference) {
      await db
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('id', paymentData.externalReference)
        .neq('status', 'paid')

      console.log(`[Webhook] Fatura ${paymentData.externalReference} → overdue`)
    }
  }

  // ─── Pagamento estornado ──────────────────────────────────────────────────
  if (eventType === 'PAYMENT_REFUNDED') {
    const paymentData = body.payment

    if (paymentData?.externalReference) {
      await db
        .from('invoices')
        .update({ status: 'refunded' })
        .eq('id', paymentData.externalReference)

      console.log(`[Webhook] Fatura ${paymentData.externalReference} → refunded`)
    }
  }

  return { received: true }
})
