export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { clientId, value, billingType, cycle, nextDueDate, description, installments } = body

    if (!clientId || !value || !nextDueDate) {
      return createError({ statusCode: 400, message: 'Missing required fields' })
    }

    const db = useDb()

    const { data: client } = await db.from('clients').select('*').eq('id', clientId).single()

    if (!client) {
      return createError({ statusCode: 404, message: 'Client not found' })
    }

    const { criarAssinaturaAsaas, criarClienteAsaas } = await import('../../utils/asaas')

    let asaasCustomerId = client.asaas_customer_id

    if (!asaasCustomerId) {
      const asaasCustomer = await criarClienteAsaas({
        name: client.name,
        email: client.email || undefined,
        phone: client.phone || undefined,
        cpfCnpj: client.cpf_cnpj || undefined,
        externalReference: client.id,
      })
      asaasCustomerId = asaasCustomer.id
      await db.from('clients').update({ asaas_customer_id: asaasCustomerId }).eq('id', clientId)
    }

    const assinatura = await criarAssinaturaAsaas({
      customer: asaasCustomerId,
      billingType: billingType || 'PIX',
      value,
      cycle: cycle || 'MONTHLY',
      nextDueDate,
      description: description || `Subscription`,
      externalReference: clientId,
      installments,
    })

    const { generateId } = await import('../../utils/db')
    const contractId = generateId()

    const { data: contract } = await db.from('contracts').insert({
      id: contractId,
      client_id: clientId,
      name: description || `Subscription`,
      start_date: nextDueDate,
      monthly_value: value,
      total_months: installments || null,
      status: assinatura.status === 'ACTIVE' ? 'active' : assinatura.status.toLowerCase(),
      notes: `Asaas ID: ${assinatura.id}`,
    }).select().single()

    return {
      success: true,
      subscription: assinatura,
      contract,
    }
  } catch (err) {
    console.error('Error creating subscription:', err)
    return createError({ statusCode: 500, message: 'Internal server error' })
  }
})
