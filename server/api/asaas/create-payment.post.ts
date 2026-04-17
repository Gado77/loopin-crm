import { criarCobrancaAsaas, criarClienteAsaas, obterQrCodePix } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { invoiceId, billingType = 'PIX', dueDate, value } = body

    if (!invoiceId) {
      throw createError({ statusCode: 400, message: 'invoiceId is required' })
    }

    const db = useDb()
    const { data: invoice } = await db.from('invoices').select('*').eq('id', invoiceId).single()

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
        email: client.email || undefined,
        phone: client.phone || undefined,
        cpfCnpj: client.cpf_cnpj || undefined,
        externalReference: client.id,
      })

      asaasCustomerId = asaasCustomer.id
      await db.from('clients').update({ asaas_customer_id: asaasCustomerId }).eq('id', client.id)
    }

    const cobranca = await criarCobrancaAsaas({
      customer: asaasCustomerId,
      billingType,
      value: value || invoice.amount,
      dueDate: dueDate || invoice.due_date,
      description: `Invoice ${invoice.id}`,
      externalReference: invoiceId,
    })

    let qrCode = null
    if (billingType === 'PIX') {
      try {
        qrCode = await obterQrCodePix(cobranca.id)
      } catch (err) {
        console.error('Error getting QR code:', err)
      }
    }

    await db.from('invoices').update({ asaas_payment_id: cobranca.id }).eq('id', invoiceId)

    return {
      success: true,
      payment: cobranca,
      qrCode,
      message: 'Payment created successfully',
    }
  } catch (err) {
    console.error('[create-payment] Error:', err)
    throw err
  }
})
