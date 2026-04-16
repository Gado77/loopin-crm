import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.deviceId || !body.clientId) {
    throw createError({ statusCode: 400, message: 'deviceId e clientId são obrigatórios' })
  }

  // Validação p/ Loopin.tv reporting (mesma chave do client-status)
  const config = useRuntimeConfig()
  const apiKey = getHeader(event, 'authorization') || getHeader(event, 'x-api-key')
  
  if (config.crmApiKey && apiKey !== `Bearer ${config.crmApiKey}` && apiKey !== config.crmApiKey) {
    throw createError({ statusCode: 401, message: 'API Key inválida' })
  }

  const db = useDb()

  const { error } = await db
    .from('screen_metrics')
    .insert({
      id: generateId(),
      device_id: body.deviceId,
      client_id: body.clientId,
      views: body.views || 0,
      recorded_at: body.recordedAt || new Date().toISOString()
    })

  if (error) {
    throw createError({ statusCode: 500, message: `Erro ao reportar métricas: ${error.message}` })
  }

  return { success: true, message: 'Métricas registradas com sucesso' }
})
