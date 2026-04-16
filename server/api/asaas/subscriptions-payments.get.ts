import { listarCobrancasAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const subscriptionId = query.subscriptionId as string

  if (!subscriptionId) {
    throw createError({ statusCode: 400, message: 'subscriptionId é obrigatório' })
  }

  const allPayments: any[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const page = await listarCobrancasAsaas({
      customer: subscriptionId,
      limit,
      offset,
    })

    const pageData = page.data || []
    allPayments.push(...pageData)

    console.log(`[subscription-payments] offset=${offset}: ${pageData.length} payments`)

    if (!pageData.length) break
    if (page.hasMore === false) break
    if (pageData.length < limit) break
    offset += limit
  }

  return {
    success: true,
    subscriptionId,
    payments: allPayments,
    counts: {
      total: allPayments.length,
      pending: allPayments.filter(p => p.status === 'PENDING').length,
      confirmed: allPayments.filter(p => p.status === 'CONFIRMED' || p.status === 'RECEIVED').length,
      overdue: allPayments.filter(p => p.status === 'OVERDUE').length,
    },
  }
})
