import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event).catch(() => ({}))

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID é obrigatório',
    })
  }

  const db = useDb()

  // Buscar fatura atual
  const { data: invoice, error: invoiceError } = await db
    .from('invoices')
    .select('*, clients(*)')
    .eq('id', id)
    .single()

  if (invoiceError || !invoice) {
    throw createError({
      statusCode: 404,
      message: 'Fatura não encontrada',
    })
  }

  // Marcar como paga
  const { error } = await db
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: body.paymentMethod || 'Dinheiro',
    })
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  // Verificar se cliente tem contrato recorrente
  const client = invoice.clients
  if (client?.contract_months && client?.contract_monthly_value) {
    // Contar quantas faturas já foram pagas desse cliente
    const { count: paidCount } = await db
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('status', 'paid')

    // Se ainda faltam parcelas
    if (paidCount && paidCount < client.contract_months) {
      const nextMonth = new Date(invoice.due_date)
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      await db.from('invoices').insert({
        id: generateId(),
        client_id: client.id,
        amount: client.contract_monthly_value,
        due_date: nextMonth.toISOString().split('T')[0],
        status: 'pending',
        notes: `Parcela ${(paidCount || 0) + 1}/${client.contract_months}`,
      })
    }
  }

  return { success: true }
})
