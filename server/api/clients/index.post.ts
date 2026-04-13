import { useDb, generateId } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: 'Nome é obrigatório',
    })
  }

  const db = useDb()
  const { data, error } = await db
    .from('clients')
    .insert({
      id: generateId(),
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

  return data
})
