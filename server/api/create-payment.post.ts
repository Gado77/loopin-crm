export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const db = useDb()
    
    if (!body.invoiceId || !body.value) {
      throw createError({ statusCode: 400, message: 'Missing required fields' })
    }

    const { data: invoice } = await db.from('invoices').select('*').eq('id', body.invoiceId).single()
    if (!invoice) {
      throw createError({ statusCode: 404, message: 'Invoice not found' })
    }

    const { data: client } = await db.from('clients').select('*').eq('id', invoice.client_id).single()
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
      }).eq('id', invoice.client_id)
    }

    const asaasPayment = await criarCobrancaAsaas({
      customer: asaasCustomerId,
      billingType: body.billingType || 'PIX',
      value: body.value,
      dueDate: body.dueDate || invoice.due_date,
      description: body.description || invoice.description,
      externalReference: body.invoiceId
    })

    const { data: updatedInvoice } = await db.from('invoices').update({ 
      status: 'pending',
      asaas_payment_id: asaasPayment.id
    }).eq('id', body.invoiceId).select().single()

    if (!updatedInvoice) {
      throw createError({ statusCode: 500, message: 'Failed to update invoice' })
    }

    return { 
      success: true, 
      invoice: updatedInvoice,
      asaasPayment
    }
  } catch (err: any) {
    console.error('Create payment error:', err)
    throw err
  }
})
