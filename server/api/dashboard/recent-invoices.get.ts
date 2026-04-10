import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()

  const { data, error } = await db
    .from('invoices')
    .select(`
      id,
      amount,
      due_date,
      status,
      client:clients(name),
      establishment:establishments(name)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return []
  }

  return data?.map(i => ({
    id: i.id,
    amount: i.amount,
    dueDate: i.due_date,
    status: i.status,
    clientName: (i.client as any)?.name,
    establishmentName: (i.establishment as any)?.name,
  })) || []
})
