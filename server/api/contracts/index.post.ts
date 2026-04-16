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
  
  // Criar contrato
  const contractId = generateId()
  const start = startDate ? new Date(startDate) : new Date()
  const endDate = new Date(start)
  endDate.setMonth(endDate.getMonth() + months)
  
  const { data: contract, error: contractError } = await db
    .from('contracts')
    .insert({
      id: contractId,
      client_id: clientId,
      months,
      monthly_value: monthlyValue,
      total_value: monthlyValue * months,
      start_date: start.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'active',
    })
    .select()
    .single()

  if (contractError) {
    throw createError({
      statusCode: 500,
      message: contractError.message,
    })
  }

  // Criar faturas vinculadas ao contrato
  const createdInvoices = []
  for (let i = 0; i < months; i++) {
    const dueDate = new Date(start)
    dueDate.setMonth(dueDate.getMonth() + i)
    
    const { data: invoice, error: invoiceError } = await db
      .from('invoices')
      .insert({
        id: generateId(),
        client_id: clientId,
        contract_id: contractId,
        amount: monthlyValue,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending',
        notes: `${i + 1}ª parcela de ${months} (Contrato ${months} meses)`,
      })
      .select()
      .single()

    if (invoiceError) {
      throw createError({
        statusCode: 500,
        message: invoiceError.message,
      })
    }

    createdInvoices.push(invoice)
  }

  return {
    success: true,
    contract,
    invoices: createdInvoices,
  }
})
