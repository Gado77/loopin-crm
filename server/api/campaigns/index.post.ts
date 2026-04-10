import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.clientId || !body.name || !body.startDate) {
    throw createError({
      statusCode: 400,
      message: 'Cliente, Nome e Data de Início são obrigatórios',
    })
  }

  const db = useDb()
  const campaignId = generateId()
  
  const { error } = await db
    .from('campaigns')
    .insert({
      id: campaignId,
      client_id: body.clientId,
      name: body.name,
      start_date: body.startDate,
      end_date: body.endDate || null,
      ad_type: body.adType || null,
      frequency: body.frequency || null,
      proof_of_play_url: body.proofOfPlayUrl || null,
      status: body.status || 'active',
    })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  if (body.establishmentIds && Array.isArray(body.establishmentIds)) {
    const associations = body.establishmentIds.map((estId: string) => ({
      campaign_id: campaignId,
      establishment_id: estId
    }))
    
    if (associations.length > 0) {
      await db.from('campaign_establishments').insert(associations)
    }
  }

  return { id: campaignId }
})
