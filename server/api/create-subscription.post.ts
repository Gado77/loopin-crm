export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const db = useDb()
    
    if (!body.clientId || !body.value || !body.nextDueDate) {
      throw createError({ statusCode: 400, message: 'Missing required fields' })
    }

    const { data: client } = await db.from('clients').select('*').eq('id', body.clientId).single()
    if (!client) {
      throw createError({ statusCode: 404, message: 'Client not found' })
    }

    let asaasCustomerId = client.asaas_customer_id
    
    if (!asaasCustomerId) {
      const asaasCustomer = await criarClienteAsaas({
        name: client.name,
        email: client.email,
        phone: client.phone,
        cpfCnpj: client.document,
        address: client.address,
        externalReference: client.id
      })
      asaasCustomerId = asaasCustomer.id
      
      await db.from('clients').update({
        asaas_customer_id: asaasCustomerId
      }).eq('id', body.clientId)
    }

    const asaasSubscription = await criarAssinaturaAsaas({
      customer: asaasCustomerId,
      billingType: body.billingType || 'PIX',
      value: body.value,
      cycle: body.cycle || 'MONTHLY',
      nextDueDate: body.nextDueDate,
      description: body.description || 'Subscription',
      externalReference: body.clientId,
      installments: body.installments
    })

    const { data: contract } = await db.from('contracts').insert({
      id: crypto.randomUUID(),
      client_id: body.clientId,
      name: body.description || 'Subscription',
      start_date: body.nextDueDate,
      monthly_value: body.value,
      total_months: body.installments || null,
      status: 'active',
      asaas_subscription_id: asaasSubscription.id
    }).select().single()

    if (!contract) {
      throw createError({ statusCode: 500, message: 'Failed to create contract' })
    }

    return { 
      success: true, 
      contract,
      asaasSubscription
    }
  } catch (err: any) {
    console.error('Create subscription error:', err)
    throw err
  }
})
