import { useDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDb()
  
  const { data, error } = await db
    .from('campaigns')
    .select(`
      *,
      client:clients(name),
      establishments:campaign_establishments(establishment:establishments(id, name))
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return data?.map(c => ({
    ...c,
    clientName: c.client?.name,
    establishmentsRendered: c.establishments?.map((e: any) => e.establishment?.name).join(', ') || '-',
    establishmentIds: c.establishments?.map((e: any) => e.establishment?.id) || [],
  })) || []
})
