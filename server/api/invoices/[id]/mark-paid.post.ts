import { useDb } from '../../../utils/db'
import { notifyLoopinTv } from '../../../utils/loopin-tv'

export default defineEventHandler(async (event) => {
  const invoiceId = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!invoiceId) {
    throw createError({ statusCode: 400, message: 'ID da fatura é obrigatório' })
  }

  const status = body.status || 'paid' // 'paid' ou 'barter'
  const paymentMethod = body.paymentMethod || 'Dinheiro'

  const db = useDb()

  // 1. Atualiza a fatura
  const { data: invoice, error } = await db
    .from('invoices')
    .update({ 
      status, 
      paid_at: new Date().toISOString(),
      payment_method: paymentMethod
    })
    .eq('id', invoiceId)
    .select('client_id')
    .single()

  if (error || !invoice) {
    throw createError({ statusCode: 500, message: `Erro ao atualizar fatura: ${error?.message || 'Fatura não encontrada'}` })
  }

  // 2. Se a fatura foi quitada (paga ou permuta), garante que o cliente seja reativado 
  // caso estivesse pausado (igual o webhook do Asaas faz)
  if (invoice.client_id) {
    const { error: clientError } = await db
      .from('clients')
      .update({ status: 'active' })
      .eq('id', invoice.client_id)
      
    if (!clientError) {
      // Avisa o Loopin.tv que o cliente agora tá ativo e com as contas em dia
      // (Não tem problema chamar activate se já estiver active)
      await notifyLoopinTv(invoice.client_id, 'activate')
    }
  }

  return { success: true, message: `Fatura atualizada para ${status}` }
})
