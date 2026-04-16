import { criarCobrancaAsaas, obterQrCodePix, criarClienteAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  if (!body.invoiceId) {
    throw createError({
      statusCode: 400,
      message: 'invoiceId é obrigatório'
    })
  }

  if (!body.billingType || !['PIX', 'BOLETO'].includes(body.billingType)) {
    throw createError({
      statusCode: 400,
      message: 'billingType deve ser PIX ou BOLETO'
    })
  }

  const { data: invoice, error: invoiceError } = await db
    .from('invoices')
    .select('*, clients(*)')
    .eq('id', body.invoiceId)
    .single()

  if (invoiceError || !invoice) {
    throw createError({
      statusCode: 404,
      message: 'Fatura não encontrada'
    })
  }

  if (invoice.asaas_payment_id) {
    throw createError({
      statusCode: 400,
      message: 'Fatura já possui cobrança no Asaas'
    })
  }

  let customerId = (invoice.clients as any)?.asaas_customer_id

  // Se não tem ID Asaas, criar cliente automaticamente
  if (!customerId) {
    console.log('[Create Payment] Cliente sem Asaas ID, criando...')
    const client = invoice.clients as any
    
    try {
      const asaasCustomer = await criarClienteAsaas({
        name: client.name || 'Cliente',
        email: client.email || undefined,
        phone: client.phone || undefined,
        cpfCnpj: client.document || undefined,
      })
      
      customerId = asaasCustomer.id
      
      // Atualizar cliente no banco com o ID do Asaas
      await db
        .from('clients')
        .update({ asaas_customer_id: customerId })
        .eq('id', client.id)
      
      console.log(`[Create Payment] Cliente criado no Asaas: ${customerId}`)
    } catch (err: any) {
      console.error('[Create Payment] Erro ao criar cliente:', err)
      throw createError({
        statusCode: 400,
        message: 'Erro ao criar cliente no Asaas: ' + (err.message || 'Verifique os dados do cliente')
      })
    }
  }

  const asaasPayment = await criarCobrancaAsaas({
    customer: customerId,
    billingType: body.billingType,
    value: Number(invoice.amount),
    dueDate: invoice.due_date,
    description: `Fatura #${invoice.id.slice(0, 8)}`,
    externalReference: invoice.id
  })

  await db
    .from('invoices')
    .update({ 
      asaas_payment_id: asaasPayment.id,
      asaas_billing_type: body.billingType
    })
    .eq('id', body.invoiceId)

  let pixData = null
  if (body.billingType === 'PIX') {
    pixData = await obterQrCodePix(asaasPayment.id)
  }

  return {
    success: true,
    payment: {
      id: asaasPayment.id,
      status: asaasPayment.status,
      value: asaasPayment.value,
      billingType: asaasPayment.billingType,
      dueDate: asaasPayment.dueDate,
      invoiceUrl: asaasPayment.invoiceUrl,
      bankSlipLink: asaasPayment.bankSlipLink,
      pixQrCode: pixData
    }
  }
})
