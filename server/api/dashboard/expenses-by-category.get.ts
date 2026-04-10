import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const { data, error } = await db
    .from('transactions')
    .select(`
      amount,
      category:expense_categories(name)
    `)
    .eq('type', 'expense')
    .gte('date', monthStart)

  if (error) {
    return []
  }

  const byCategory: Record<string, number> = {}
  data?.forEach(t => {
    const cat = t.category?.name || 'Sem categoria'
    byCategory[cat] = (byCategory[cat] || 0) + Number(t.amount)
  })

  return Object.entries(byCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
})
