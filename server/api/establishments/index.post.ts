import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: 'Nome do ponto é obrigatório',
    })
  }

  const db = useDb()
  const { data, error } = await db
    .from('establishments')
    .insert({
      id: generateId(),
      name: body.name,
      responsible_name: body.responsibleName || null,
      address: body.address || null,
      screens_count: body.screensCount || 1,
      estimated_flow: body.estimatedFlow || null,
      audience_type: body.audienceType || null,
      location_cost: body.locationCost || 0,
      status: body.status || 'active',
    })
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return data
})
