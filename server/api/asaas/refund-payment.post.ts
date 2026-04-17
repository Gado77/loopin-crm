import { reembolsarCobrancaAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  if (!body.paymentId && !body.invoiceId) {
    throw createError({
      statusCode: 400,
      message: 'paymentId ou invoiceId e obrigatorio'
    })
  }

  let paymentId = body.paymentId
  let invoiceId = body.invoiceId

  // Buscar pelo invoiceId se não tiver paymentId
  if (!paymentId && invoiceId) {
    const { data: invoice } = await db
      .from('invoices')
      .select('asaas_payment_id')
      .eq('id', invoiceId)
      .single()

    if (!invoice?.asaas_payment_id) {
      throw createError({
        statusCode: 400,
        message: 'Fatura nao possui cobranca no Asaas para estornar'
      })
    }
    paymentId = invoice.asaas_payment_id
  }

  try {
    const result = await reembolsarCobrancaAsaas(paymentId, body.value)

    // Atualizar status da fatura
    if (invoiceId) {
      await db
        .from('invoices')
        .update({ status: 'refunded' })
        .eq('id', invoiceId)
    } else {
      await db
        .from('invoices')
        .update({ status: 'refunded' })
        .eq('asaas_payment_id', paymentId)
    }

    return {
      success: true,
      message: 'Estorno solicitado com sucesso',
      data: { id: result.id, status: result.status }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao solicitar estorno'
    })
  }
})
