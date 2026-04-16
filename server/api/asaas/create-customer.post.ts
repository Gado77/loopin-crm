import { criarClienteAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  if (!body.clientId) {
    throw createError({
      statusCode: 400,
      message: 'clientId é obrigatório'
    })
  }

  const { data: client, error: clientError } = await db
    .from('clients')
    .select('*')
    .eq('id', body.clientId)
    .single()

  if (clientError || !client) {
    throw createError({
      statusCode: 404,
      message: 'Cliente não encontrado'
    })
  }

  if (client.asaas_customer_id) {
    return { 
      success: true, 
      message: 'Cliente já possui ID Asaas',
      customerId: client.asaas_customer_id 
    }
  }

  const asaasCustomer = await criarClienteAsaas({
    name: client.name,
    email: client.email || undefined,
    phone: client.phone || undefined,
    cpfCnpj: client.document || undefined
  })

  await db
    .from('clients')
    .update({ asaas_customer_id: asaasCustomer.id })
    .eq('id', body.clientId)

  return {
    success: true,
    customerId: asaasCustomer.id
  }
})
