import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID é obrigatório',
    })
  }

  const db = useDb()

  const { data: client, error: clientError } = await db
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (clientError || !client) {
    throw createError({
      statusCode: 404,
      message: 'Cliente não encontrado',
    })
  }

  const { data: establishments } = await db
    .from('establishments')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const { data: invoices } = await db
    .from('invoices')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    ...client,
    establishments: establishments || [],
    invoices: invoices || [],
  }
})
