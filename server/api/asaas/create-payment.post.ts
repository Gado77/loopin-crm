import { criarCobrancaAsaas, obterQrCodePix, criarClienteAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  if (!body.invoiceId) {
    throw createError({ statusCode: 400, message: 'invoiceId é obrigatório' })
  }

  const allowedTypes = ['PIX', 'BOLETO', 'CREDIT_CARD']
  if (!body.billingType || !allowedTypes.includes(body.billingType)) {
    throw createError({ statusCode: 400, message: 'billingType deve ser PIX, BOLETO ou CREDIT_CARD' })
  }

  const { data: invoice, error: invoiceError } = await db
    .from('invoices')
    .select('*, clients(*)')
    .eq('id', body.invoiceId)
    .single()

  if (invoiceError || !invoice) {
    throw createError({ statusCode: 404, message: 'Fatura não encontrada' })
  }

  // Se já tem cobrança no Asaas, retornar os dados existentes em vez de erro
  if (invoice.asaas_payment_id) {
    const { buscarCobrancaAsaas } = await import('../../utils/asaas')
    try {
      const existing = await buscarCobrancaAsaas(invoice.asaas_payment_id)

      let pixData = null
      if (invoice.asaas_billing_type === 'PIX') {
        try {
          pixData = await obterQrCodePix(invoice.asaas_payment_id)
        } catch {}
      }

      return {
        success: true,
        alreadyExists: true,
        payment: {
          id: existing.id,
          status: existing.status,
          value: existing.value,
          billingType: existing.billingType,
          dueDate: existing.dueDate,
          invoiceUrl: existing.invoiceUrl,
          bankSlipLink: existing.bankSlipLink,
          pixQrCode: pixData
        }
      }
    } catch {
      // Se não conseguiu buscar no Asaas, continua e permite recriar
    }
  }

  let customerId = (invoice.clients as any)?.asaas_customer_id

  // Criar cliente no Asaas automaticamente se não existir
  if (!customerId) {
    const client = invoice.clients as any

    try {
      const asaasCustomer = await criarClienteAsaas({
        name: client.name || 'Cliente',
        email: client.email || undefined,
        phone: client.phone || undefined,
        cpfCnpj: client.document || undefined,
        externalReference: client.id
      })

      customerId = asaasCustomer.id

      await db
        .from('clients')
        .update({ asaas_customer_id: customerId })
        .eq('id', client.id)
    } catch (err: any) {
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
    description: `Fatura Loopin CRM #${invoice.id.slice(0, 8)}`,
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
    try {
      pixData = await obterQrCodePix(asaasPayment.id)
    } catch {}
  }

  return {
    success: true,
    alreadyExists: false,
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
