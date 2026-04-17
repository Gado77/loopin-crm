import { criarAssinaturaAsaas, criarClienteAsaas } from '../../utils/asaas'
import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const {
    clientId,
    value,
    billingType = 'PIX',
    cycle = 'MONTHLY',
    nextDueDate,
    description,
    installments,
  } = body

  // Validação
  if (!clientId || !value || !nextDueDate) {
    throw createError({
      statusCode: 400,
      message: 'clientId, value e nextDueDate sao obrigatorios',
    })
  }

  if (value < 1) {
    throw createError({
      statusCode: 400,
      message: 'Valor minimo e R$ 1,00',
    })
  }

  const db = useDb()

  // Buscar cliente
  const { data: client, error: clientError } = await db
    .from('clients')
    .select('id, name, email, phone, cpf_cnpj, asaas_customer_id')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    throw createError({ statusCode: 404, message: 'Cliente nao encontrado' })
  }

  let asaasCustomerId = client.asaas_customer_id

  // Se cliente não existe no Asaas, criar
  if (!asaasCustomerId) {
    const asaasCustomer = await criarClienteAsaas({
      name: client.name,
      email: client.email || undefined,
      phone: client.phone || undefined,
      cpfCnpj: client.cpf_cnpj || undefined,
      externalReference: client.id,
    })

    asaasCustomerId = asaasCustomer.id

    // Atualizar cliente local com ID do Asaas
    await db
      .from('clients')
      .update({ asaas_customer_id: asaasCustomerId })
      .eq('id', clientId)
  }

  // Criar assinatura no Asaas
  const assinatura = await criarAssinaturaAsaas({
    customer: asaasCustomerId,
    billingType,
    value,
    cycle,
    nextDueDate,
    description: description || `Assinatura ${client.name}`,
    externalReference: clientId,
    installments,
  })

  // Criar contrato local
  const contractId = generateId()
  const { data: contract, error: contractError } = await db
    .from('contracts')
    .insert({
      id: contractId,
      client_id: clientId,
      name: description || `Assinatura ${client.name}`,
      start_date: nextDueDate,
      monthly_value: value,
      total_months: installments || null,
      status: assinatura.status === 'ACTIVE' ? 'active' : assinatura.status.toLowerCase(),
      notes: `Asaas Subscription ID: ${assinatura.id}`,
    })
    .select()
    .single()

  if (contractError) {
    console.error('[create-subscription] Erro ao criar contrato local:', contractError)
  }

  return {
    success: true,
    subscription: assinatura,
    contract,
    message: 'Assinatura criada no Asaas e contrato registrado no CRM!',
  }
})
