import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID é obrigatório',
    })
  }

  const db = useDb()
  const { error } = await db
    .from('establishments')
    .update({
      name: body.name,
      responsible_name: body.responsibleName || null,
      address: body.address || null,
      screens_count: body.screensCount || 1,
      estimated_flow: body.estimatedFlow || null,
      audience_type: body.audienceType || null,
      location_cost: body.locationCost || 0,
      status: body.status || 'active',
    })
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return { id, ...body }
})
