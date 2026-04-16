const ASAAS_BASE_URL = 'https://api.asaas.com'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  phone: string
  cpfCnpj: string
  postalCode: string
  address: string
  addressNumber: string
  complement: string
  province: string
}

export interface AsaasPayment {
  id: string
  customer: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED'
  value: number
  dueDate: string
  status: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'CANCELLED'
  pixQrCode?: {
    encodedImage: string
    payload: string
    expirationDate: string
  }
  invoiceUrl?: string
  bankSlipLink?: string
}

function getHeaders() {
  if (!ASAAS_API_KEY) {
    throw createError({
      statusCode: 500,
      message: 'ASAAS_API_KEY não configurada'
    })
  }
  return {
    'Content-Type': 'application/json',
    'access_token': ASAAS_API_KEY
  }
}

export async function criarClienteAsaas(data: {
  name: string
  email?: string
  phone?: string
  cpfCnpj?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
}): Promise<AsaasCustomer> {
  const response = await fetch(`${ASAAS_BASE_URL}/v3/customers`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw createError({
      statusCode: response.status,
      message: error.errors?.[0]?.description || 'Erro ao criar cliente no Asaas'
    })
  }

  return response.json()
}

export async function buscarClienteAsaas(asaasCustomerId: string): Promise<AsaasCustomer> {
  const response = await fetch(`${ASAAS_BASE_URL}/v3/customers/${asaasCustomerId}`, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json()
    throw createError({
      statusCode: response.status,
      message: error.errors?.[0]?.description || 'Erro ao buscar cliente no Asaas'
    })
  }

  return response.json()
}

export async function criarCobrancaAsaas(data: {
  customer: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  value: number
  dueDate: string
  description?: string
  externalReference?: string
}): Promise<AsaasPayment> {
  const response = await fetch(`${ASAAS_BASE_URL}/v3/payments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw createError({
      statusCode: response.status,
      message: error.errors?.[0]?.description || 'Erro ao criar cobrança no Asaas'
    })
  }

  return response.json()
}

export async function buscarCobrancaAsaas(paymentId: string): Promise<AsaasPayment> {
  const response = await fetch(`${ASAAS_BASE_URL}/v3/payments/${paymentId}`, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json()
    throw createError({
      statusCode: response.status,
      message: error.errors?.[0]?.description || 'Erro ao buscar cobrança no Asaas'
    })
  }

  return response.json()
}

export async function obterQrCodePix(paymentId: string): Promise<{
  encodedImage: string
  payload: string
  expirationDate: string
}> {
  const response = await fetch(`${ASAAS_BASE_URL}/v3/payments/${paymentId}/pixQrCode`, {
    method: 'GET',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json()
    throw createError({
      statusCode: response.status,
      message: error.errors?.[0]?.description || 'Erro ao obter QR Code Pix'
    })
  }

  return response.json()
}

export async function criarLinkPagamento(data: {
  customer: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  value: number
  dueDate: string
  name: string
  description?: string
}): Promise<{
  id: string
  url: string
}> {
  const response = await fetch(`${ASAAS_BASE_URL}/v3/paymentLinks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw createError({
      statusCode: response.status,
      message: error.errors?.[0]?.description || 'Erro ao criar link de pagamento'
    })
  }

  return response.json()
}

export function mapearStatusAsaas(asaasStatus: string): string {
  switch (asaasStatus) {
    case 'CONFIRMED':
    case 'RECEIVED':
      return 'paid'
    case 'OVERDUE':
      return 'overdue'
    case 'CANCELLED':
      return 'cancelled'
    case 'PENDING':
    default:
      return 'pending'
  }
}

export async function reenviarCobrancaAsaas(paymentId: string): Promise<{
  id: string
  status: string
}> {
  const response = await fetch(`${ASAAS_BASE_URL}/v3/payments/${paymentId}/sendEmailNotification`, {
    method: 'POST',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json()
    throw createError({
      statusCode: response.status,
      message: error.errors?.[0]?.description || 'Erro ao reenviar cobrança'
    })
  }

  return response.json()
}

export async function cancelarCobrancaAsaas(paymentId: string): Promise<{
  id: string
  status: string
}> {
  const response = await fetch(`${ASAAS_BASE_URL}/v3/payments/${paymentId}/cancel`, {
    method: 'POST',
    headers: getHeaders()
  })

  if (!response.ok) {
    const error = await response.json()
    throw createError({
      statusCode: response.status,
      message: error.errors?.[0]?.description || 'Erro ao cancelar cobrança'
    })
  }

  return response.json()
}
