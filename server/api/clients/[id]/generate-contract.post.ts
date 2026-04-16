import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { clientId, months, startDate, monthlyValue } = body

  if (!clientId || !months || !monthlyValue) {
    throw createError({
      statusCode: 400,
      message: 'clientId, months e monthlyValue são obrigatórios',
    })
  }

  const db = useDb()
  const createdInvoices = []
  
  const start = startDate ? new Date(startDate) : new Date()
  
  for (let i = 0; i < months; i++) {
    const dueDate = new Date(start)
    dueDate.setMonth(dueDate.getMonth() + i)
    
    const { data, error } = await db
      .from('invoices')
      .insert({
        id: generateId(),
        client_id: clientId,
        amount: monthlyValue,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending',
        notes: `Parcela ${i + 1}/${months}`,
      })
      .select()
      .single()

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      })
    }

    createdInvoices.push(data)
  }

  // Atualizar cliente com dados do contrato
  await db
    .from('clients')
    .update({
      contract_months: months,
      contract_start_date: start.toISOString().split('T')[0],
      contract_monthly_value: monthlyValue,
    })
    .eq('id', clientId)

  return {
    success: true,
    created: createdInvoices.length,
    invoices: createdInvoices,
  }
})
