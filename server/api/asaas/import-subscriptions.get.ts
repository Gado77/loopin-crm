import { listarAssinaturasAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)
  const dryRun = query.dryRun === 'true'

  const allSubscriptions: any[] = []
  let offset = 0
  const limit = 100
  const maxSubscriptions = 1000

  while (true) {
    if (allSubscriptions.length >= maxSubscriptions) {
      console.warn(`[import-subscriptions] Limite de ${maxSubscriptions} assinaturas atingido`)
      break
    }

    const page = await listarAssinaturasAsaas({ limit, offset })
    const pageData = page.data || []
    allSubscriptions.push(...pageData)

    console.log(`[import-subscriptions] Página offset=${offset}: ${pageData.length} assinaturas (total: ${allSubscriptions.length})`)

    if (!pageData.length) break
    if (page.hasMore === false) break
    if (pageData.length < limit) break
    offset += limit
  }

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      message: `Simulação: ${allSubscriptions.length} assinaturas encontradas no Asaas`,
      subscriptions: allSubscriptions.map(s => ({
        id: s.id,
        customer: s.customer,
        value: s.value,
        cycle: s.cycle,
        status: s.status,
        nextDueDate: s.nextDueDate,
        description: s.description,
      })),
    }
  }

  return {
    success: true,
    dryRun: false,
    message: `${allSubscriptions.length} assinaturas encontradas no Asaas`,
    subscriptions: allSubscriptions,
    counts: {
      total: allSubscriptions.length,
      active: allSubscriptions.filter(s => s.status === 'ACTIVE').length,
      inactive: allSubscriptions.filter(s => s.status === 'INACTIVE').length,
      cancelled: allSubscriptions.filter(s => s.status === 'CANCELLED').length,
    },
  }
})
