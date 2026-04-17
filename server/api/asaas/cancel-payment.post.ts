import { cancelarCobrancaAsaas } from '../../utils/asaas'
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

  if (!paymentId && body.invoiceId) {
    const { data: invoice } = await db
      .from('invoices')
      .select('asaas_payment_id')
      .eq('id', body.invoiceId)
      .single()
    
    if (!invoice?.asaas_payment_id) {
      throw createError({
        statusCode: 400,
        message: 'Fatura nao possui cobranca no Asaas'
      })
    }
    paymentId = invoice.asaas_payment_id
  }

  try {
    const result = await cancelarCobrancaAsaas(paymentId)
    
    if (body.invoiceId) {
      await db
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', body.invoiceId)
    }
    
    return {
      success: true,
      message: 'Cobranca cancelada',
      data: result
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao cancelar cobranca'
    })
  }
})