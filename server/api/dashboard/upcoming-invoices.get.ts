import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data, error } = await db
    .from('invoices')
    .select(`
      id,
      amount,
      due_date,
      client:clients(name),
      establishment:establishments(name)
    `)
    .eq('status', 'pending')
    .gte('due_date', today)
    .lte('due_date', nextWeek)
    .order('due_date', { ascending: true })
    .limit(5)

  if (error) {
    return []
  }

  return data?.map(i => ({
    id: i.id,
    amount: i.amount,
    dueDate: i.due_date,
    clientName: i.client?.name,
    establishmentName: i.establishment?.name,
  })) || []
})
