import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) { throw createError({ statusCode: 400, message: 'ID é obrigatório' }) }

  const db = useDb()
  const { error } = await db
    .from('campaigns')
    .update({
      client_id: body.clientId,
      name: body.name,
      start_date: body.startDate,
      end_date: body.endDate || null,
      ad_type: body.adType || null,
      frequency: body.frequency || null,
      proof_of_play_url: body.proofOfPlayUrl || null,
      status: body.status || 'active',
    })
    .eq('id', id)

  if (error) { throw createError({ statusCode: 500, message: error.message }) }

  // Clear existing relationships first
  await db.from('campaign_establishments').delete().eq('campaign_id', id)
  
  // Create new relations
  if (body.establishmentIds && Array.isArray(body.establishmentIds)) {
    const associations = body.establishmentIds.map((estId: string) => ({
      campaign_id: id,
      establishment_id: estId
    }))
    
    if (associations.length > 0) {
      await db.from('campaign_establishments').insert(associations)
    }
  }

  return { id, ...body }
})
