import { buscarCobrancaAsaas, mapearStatusAsaas } from '../../../utils/asaas'
import { useDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID do pagamento é obrigatório'
    })
  }

  const { data: invoice, error: invoiceError } = await db
    .from('invoices')
    .select('*')
    .eq('asaas_payment_id', id)
    .single()

  if (invoiceError || !invoice) {
    throw createError({
      statusCode: 404,
      message: 'Fatura não encontrada para este pagamento'
    })
  }

  const payment = await buscarCobrancaAsaas(id)
  const mappedStatus = mapearStatusAsaas(payment.status)

  if (mappedStatus === 'paid' && invoice.status !== 'paid') {
    await db
      .from('invoices')
      .update({ 
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', invoice.id)
  }

  return {
    success: true,
    payment: {
      id: payment.id,
      status: payment.status,
      mappedStatus,
      value: payment.value,
      billingType: payment.billingType
    }
  }
})
