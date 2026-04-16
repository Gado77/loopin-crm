import { useDb, generateId } from '../../utils/db'

const LOOPIN_TV_FUNCTIONS_URL = process.env.LOOPIN_TV_FUNCTIONS_URL || 'https://sxsmirhqbslmvyesikgg.supabase.co/functions/v1'
const LOOPIN_TV_SERVICE_ROLE_KEY = process.env.LOOPIN_TV_SERVICE_ROLE_KEY

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: 'Nome é obrigatório',
    })
  }

  const db = useDb()
  const clientId = generateId()
  
  const { data, error } = await db
    .from('clients')
    .insert({
      id: clientId,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      document: body.document || null,
      address: body.address || null,
      contact_name: body.contactName || null,
      grace_days: body.graceDays || 30,
      segment: body.segment || null,
      lead_source: body.leadSource || null,
      plan_type: body.planType || null,
      monthly_fee: body.monthlyFee || 0,
      start_date: body.startDate || null,
      renewal_date: body.renewalDate || null,
      status: body.status || 'active',
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  // Sincronizar para Loopin.tv (criar advertiser)
  // Não sincroniza se ENABLE_LOOPIN_SYNC=false (para evitar loops)
  if (LOOPIN_TV_SERVICE_ROLE_KEY && process.env.ENABLE_LOOPIN_SYNC !== 'false') {
    try {
      // Verifica se advertiser já existe para evitar loop
      const { data: existingAdv } = await db
        .from('advertisers')
        .select('id')
        .eq('id', clientId)
        .single()
      
      // Só sincroniza se não existir no Loopin.tv
      if (!existingAdv) {
        await fetch(`${LOOPIN_TV_FUNCTIONS_URL}/create-advertiser`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LOOPIN_TV_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            clientId: clientId,
            name: body.name,
            email: body.email || null,
            phone: body.phone || null,
            segment: body.segment || null,
            contactName: body.contactName || null,
          }),
        })
      }
    } catch (syncError) {
      console.error('Erro ao sincronizar com Loopin.tv:', syncError)
    }
  }

  return data
})
