import { criarAssinaturaAsaas, criarClienteAsaas } from '../../utils/asaas'
import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { clientId, value, billingType = 'PIX', cycle = 'MONTHLY', nextDueDate, description, installments } = body

    if (!clientId || !value || !nextDueDate) {
      throw createError({ statusCode: 400, message: 'Missing: clientId, value, nextDueDate' })
    }

    if (value < 1) {
      throw createError({ statusCode: 400, message: 'Value must be at least 1.00' })
    }

    const db = useDb()
    const { data: client } = await db.from('clients').select('id, name, email, phone, cpf_cnpj, asaas_customer_id').eq('id', clientId).single()

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

      await db.from('clients').update({ asaas_customer_id: asaasCustomerId }).eq('id', clientId)
    }

    const assinatura = await criarAssinaturaAsaas({
      customer: asaasCustomerId,
      billingType,
      value,
      cycle,
      nextDueDate,
      description: description || `Subscription - ${client.name}`,
      externalReference: clientId,
      installments,
    })

    const contractId = generateId()
    const { data: contract } = await db.from('contracts').insert({
      id: contractId,
      client_id: clientId,
      name: description || `Subscription - ${client.name}`,
      start_date: nextDueDate,
      monthly_value: value,
      total_months: installments || null,
      status: assinatura.status === 'ACTIVE' ? 'active' : assinatura.status.toLowerCase(),
      notes: `Asaas Subscription ID: ${assinatura.id}`,
    }).select().single()

    return {
      success: true,
      subscription: assinatura,
      contract,
      message: 'Subscription created successfully',
    }
  } catch (err) {
    console.error('[create-subscription] Error:', err)
    throw err
  }
})
