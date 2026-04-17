import { criarClienteAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { clientId, name, email, phone, cpfCnpj } = body

    if (!clientId) {
      throw createError({ statusCode: 400, message: 'clientId is required' })
    }

    const db = useDb()
    const { data: client } = await db.from('clients').select('*').eq('id', clientId).single()

    if (!client) {
      throw createError({ statusCode: 404, message: 'Client not found' })
    }

    const asaasCustomer = await criarClienteAsaas({
      name: name || client.name,
      email: email || client.email,
      phone: phone || client.phone,
      cpfCnpj: cpfCnpj || client.cpf_cnpj,
      externalReference: clientId,
    })

    await db.from('clients').update({ asaas_customer_id: asaasCustomer.id }).eq('id', clientId)

    return {
      success: true,
      customer: asaasCustomer,
      message: 'Customer created successfully',
    }
  } catch (err) {
    console.error('[create-customer] Error:', err)
    throw err
  }
})
