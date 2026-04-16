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
    .from('clients')
    .update({
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
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return { id, ...body }
})
