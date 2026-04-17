import { criarClienteAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidCpfCnpj(doc: string): boolean {
  const clean = doc.replace(/\D/g, '')
  if (clean.length === 11) {
    return validarCpf(clean)
  } else if (clean.length === 14) {
    return validarCnpj(clean)
  }
  return false
}

function validarCpf(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(cpf[10])
}

function validarCnpj(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const calc = (weights: number[], nums: string[]) => {
    let sum = 0
    weights.forEach((w, i) => sum += w * parseInt(nums[i]))
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }
  const digits = cnpj.split('')
  if (calc(weights1, digits) !== parseInt(digits[12])) return false
  if (calc(weights2, digits) !== parseInt(digits[13])) return false
  return true
}

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

  if (!client.name || client.name.trim() === '') {
    throw createError({
      statusCode: 400,
      message: 'Nome do cliente é obrigatório para sincronizar com Asaas'
    })
  }

  if (client.email && !isValidEmail(client.email)) {
    throw createError({
      statusCode: 400,
      message: 'Email do cliente é inválido'
    })
  }

  if (client.document && !isValidCpfCnpj(client.document)) {
    throw createError({
      statusCode: 400,
      message: 'CPF/CNPJ do cliente é inválido'
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
