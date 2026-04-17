import { criarCobrancaAsaas, obterQrCodePix, criarClienteAsaas, buscarCobrancaAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

// Retorna a data de hoje no formato YYYY-MM-DD (timezone de Brasília)
function todayBR(): string {
  const now = new Date()
  // UTC-3
  now.setHours(now.getHours() - 3)
  return now.toISOString().split('T')[0]
}

// Garante que a dueDate nao fique no passado (Asaas rejeita com 400)
function resolverDueDate(invoiceDueDate: string | null): string {
  const today = todayBR()
  if (!invoiceDueDate || invoiceDueDate < today) {
    console.log(`[create-payment] dueDate ${invoiceDueDate} esta no passado → usando hoje (${today})`)
    return today
  }
  return invoiceDueDate
}

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  if (!body.invoiceId) {
    throw createError({ statusCode: 400, message: 'invoiceId e obrigatorio' })
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
    throw createError({ statusCode: 404, message: 'Fatura nao encontrada' })
  }

  // Validação de valor mínimo
  const valor = Number(invoice.amount)
  if (!valor || valor < 1) {
    throw createError({
      statusCode: 400,
      message: `Valor da fatura (R$ ${valor.toFixed(2)}) e menor que o minimo do Asaas (R$ 1,00)`
    })
  }

  // Se já tem cobrança no Asaas, retornar os dados existentes em vez de criar outra
  if (invoice.asaas_payment_id) {
    try {
      const existing = await buscarCobrancaAsaas(invoice.asaas_payment_id)

      let pixData = null
      if (invoice.asaas_billing_type === 'PIX') {
        try { pixData = await obterQrCodePix(invoice.asaas_payment_id) } catch {}
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
       // Cobranca nao existe mais no Asaas → limpa o ID e recria
      await db
        .from('invoices')
        .update({ asaas_payment_id: null, asaas_billing_type: null })
        .eq('id', body.invoiceId)
    }
  }

  let customerId = (invoice.clients as any)?.asaas_customer_id

  // Criar cliente no Asaas automaticamente se não existir
  if (!customerId) {
    const client = invoice.clients as any

    // Limpar CPF/CNPJ: remover pontuação
    const docRaw = (client.document || '').replace(/[^\d]/g, '')
    const cpfCnpj = docRaw.length >= 11 ? docRaw : undefined

    try {
      const asaasCustomer = await criarClienteAsaas({
        name: client.name || 'Cliente',
        email: client.email || undefined,
        phone: client.phone || undefined,
        cpfCnpj,
        externalReference: client.id
      })

      customerId = asaasCustomer.id

      await db
        .from('clients')
        .update({ asaas_customer_id: customerId })
        .eq('id', client.id)

      console.log(`[create-payment] Cliente criado no Asaas: ${customerId} — "${client.name}"`)
    } catch (err: any) {
      throw createError({
        statusCode: 400,
        message: 'Erro ao criar cliente no Asaas: ' + (err.message || 'Verifique os dados do cliente')
      })
    }
  }

  // Ajustar data de vencimento para não ficar no passado
  const dueDate = resolverDueDate(invoice.due_date)

  console.log(`[create-payment] Criando cobrança: cliente=${customerId}, tipo=${body.billingType}, valor=${valor}, vencimento=${dueDate}`)

  let asaasPayment
  try {
    asaasPayment = await criarCobrancaAsaas({
      customer: customerId,
      billingType: body.billingType,
      value: valor,
      dueDate,
      description: `Fatura Loopin CRM #${invoice.id.slice(0, 8)}`,
      externalReference: invoice.id
    })
  } catch (err: any) {
    console.error('[create-payment] Erro Asaas:', err.message)
    // Re-throw com a mensagem exata do Asaas para o frontend ver
    throw createError({
      statusCode: err.statusCode || 400,
      message: err.message || 'Erro ao criar cobranca no Asaas'
    })
  }

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
    } catch (err: any) {
      console.error('[create-payment] Erro ao buscar QR Code Pix:', err.message)
    }
  }

  console.log(`[create-payment] Cobranca criada: ${asaasPayment.id}`)

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
