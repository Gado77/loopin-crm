/**
 * Asaas API Client — Loopin CRM
 * Usa useRuntimeConfig() dentro de cada função para garantir que a key
 * seja lida corretamente em ambientes serverless (Vercel / Nitro).
 */

const ASAAS_BASE_URL = 'https://api.asaas.com'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AsaasCustomer {
  id: string
  name: string
  email?: string
  phone?: string
  mobilePhone?: string
  cpfCnpj?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  externalReference?: string
}

export interface AsaasPayment {
  id: string
  customer: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED'
  value: number
  dueDate: string
  status: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'REFUND_REQUESTED' | 'CANCELLED'
  description?: string
  externalReference?: string
  invoiceUrl?: string
  bankSlipUrl?: string
  bankSlipLink?: string
  pixQrCode?: {
    encodedImage: string
    payload: string
    expirationDate: string
  }
}

export interface AsaasPixQrCode {
  encodedImage: string
  payload: string
  expirationDate: string
}

export interface AsaasPaymentList {
  data: AsaasPayment[]
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
}

export interface AsaasCustomerList {
  data: AsaasCustomer[]
  hasMore: boolean
  totalCount: number
}

export interface AsaasSubscription {
  id: string
  customer: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED'
  value: number
  cycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  nextDueDate: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED'
  description?: string
  externalReference?: string
  lastPaymentDate?: string
  paymentLink?: string
  miniumValue?: number
  fineForAfterPayment?: number
  interestForAfterPayment?: number
}

export interface AsaasSubscriptionList {
  data: AsaasSubscription[]
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
}

// ─── Helper interno ───────────────────────────────────────────────────────────

function getHeaders() {
  const config = useRuntimeConfig()
  const apiKey = config.asaasApiKey as string

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'ASAAS_API_KEY não configurada. Configure a variável de ambiente.'
    })
  }

  return {
    'Content-Type': 'application/json',
    'access_token': apiKey
  }
}

async function asaasFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${ASAAS_BASE_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers as Record<string, string> || {})
    }
  })

  if (!response.ok) {
    let errorMsg = `Erro Asaas ${response.status}`
    try {
      const body = await response.json()
      errorMsg = body.errors?.[0]?.description || body.message || errorMsg
    } catch {}

    throw createError({
      statusCode: response.status,
      message: errorMsg
    })
  }

  return response.json()
}

// ─── Clientes ─────────────────────────────────────────────────────────────────

export async function criarClienteAsaas(data: {
  name: string
  email?: string
  phone?: string
  mobilePhone?: string
  cpfCnpj?: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  externalReference?: string
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>('/v3/customers', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function atualizarClienteAsaas(
  asaasCustomerId: string,
  data: Partial<{
    name: string
    email: string
    phone: string
    mobilePhone: string
    cpfCnpj: string
    postalCode: string
    address: string
    addressNumber: string
    complement: string
    province: string
  }>
): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(`/v3/customers/${asaasCustomerId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function buscarClienteAsaas(asaasCustomerId: string): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(`/v3/customers/${asaasCustomerId}`)
}

export async function listarClientesAsaas(limit = 100, offset = 0): Promise<AsaasCustomerList> {
  return asaasFetch<AsaasCustomerList>(`/v3/customers?limit=${limit}&offset=${offset}`)
}

// ─── Cobranças ────────────────────────────────────────────────────────────────

export async function criarCobrancaAsaas(data: {
  customer: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  postalService?: boolean
}): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>('/v3/payments', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function buscarCobrancaAsaas(paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/v3/payments/${paymentId}`)
}

export async function listarCobrancasAsaas(params: {
  customer?: string
  status?: string
  limit?: number
  offset?: number
} = {}): Promise<AsaasPaymentList> {
  const q = new URLSearchParams()
  if (params.customer) q.set('customer', params.customer)
  if (params.status) q.set('status', params.status)
  q.set('limit', String(params.limit ?? 50))
  q.set('offset', String(params.offset ?? 0))

  return asaasFetch<AsaasPaymentList>(`/v3/payments?${q.toString()}`)
}

export async function obterQrCodePix(paymentId: string): Promise<AsaasPixQrCode> {
  return asaasFetch<AsaasPixQrCode>(`/v3/payments/${paymentId}/pixQrCode`)
}

export async function reenviarCobrancaAsaas(paymentId: string): Promise<{ success: boolean }> {
  return asaasFetch<{ success: boolean }>(
    `/v3/payments/${paymentId}/sendEmailNotification`,
    { method: 'POST' }
  )
}

export async function cancelarCobrancaAsaas(paymentId: string): Promise<{ id: string; deleted: boolean }> {
  return asaasFetch<{ id: string; deleted: boolean }>(
    `/v3/payments/${paymentId}/cancel`,
    { method: 'POST' }
  )
}

export async function reembolsarCobrancaAsaas(
  paymentId: string,
  value?: number
): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/v3/payments/${paymentId}/refund`, {
    method: 'POST',
    body: value !== undefined ? JSON.stringify({ value }) : undefined
  })
}

export async function criarLinkPagamento(data: {
  name: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED'
  chargeType: 'DETACHED' | 'RECURRENT'
  value?: number
  dueDateLimitDays?: number
  subscriptionCycle?: string
  description?: string
  endDate?: string
  maxInstallmentCount?: number
}): Promise<{ id: string; url: string }> {
  return asaasFetch<{ id: string; url: string }>('/v3/paymentLinks', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// ─── Assinaturas ────────────────────────────────────────────────────────────────

export async function criarAssinaturaAsaas(data: {
  customer: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  value: number
  cycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  nextDueDate: string
  description?: string
  externalReference?: string
  installments?: number
}): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>('/v3/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function buscarAssinaturaAsaas(subscriptionId: string): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/v3/subscriptions/${subscriptionId}`)
}

export async function listarAssinaturasAsaas(params: {
  customer?: string
  status?: string
  limit?: number
  offset?: number
} = {}): Promise<AsaasSubscriptionList> {
  const q = new URLSearchParams()
  if (params.customer) q.set('customer', params.customer)
  if (params.status) q.set('status', params.status)
  q.set('limit', String(params.limit ?? 100))
  q.set('offset', String(params.offset ?? 0))

  return asaasFetch<AsaasSubscriptionList>(`/v3/subscriptions?${q.toString()}`)
}

export async function atualizarAssinaturaAsaas(
  subscriptionId: string,
  data: Partial<{
    description: string
    value: number
    nextDueDate: string
    billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  }>
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/v3/subscriptions/${subscriptionId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function cancelarAssinaturaAsaas(subscriptionId: string): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/v3/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST'
  })
}

// ─── Status mapping ───────────────────────────────────────────────────────────

export function mapearStatusAsaas(asaasStatus: string): string {
  switch (asaasStatus) {
    case 'CONFIRMED':
    case 'RECEIVED':
      return 'paid'
    case 'OVERDUE':
      return 'overdue'
    case 'CANCELLED':
      return 'cancelled'
    case 'REFUNDED':
    case 'REFUND_REQUESTED':
      return 'refunded'
    case 'PENDING':
    default:
      return 'pending'
  }
}

// ─── Teste de conectividade ───────────────────────────────────────────────────

export async function testarConexaoAsaas(): Promise<{ connected: boolean; account?: string; error?: string }> {
  try {
    const data = await asaasFetch<{ name: string; email: string }>('/v3/myAccount')
    return { connected: true, account: data.name || data.email }
  } catch (err: any) {
    return { connected: false, error: err.message }
  }
}
