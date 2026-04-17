export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDb()
  
  if (!body.invoiceId || !body.value) {
    throw createError({ statusCode: 400, message: 'Missing fields' })
  }

  const invoice = await db.from('invoices').select('*').eq('id', body.invoiceId).single()
  if (!invoice.data) {
    throw createError({ statusCode: 404, message: 'Invoice not found' })
  }

  const result = await db.from('invoices').update({ 
    status: 'processing',
  }).eq('id', body.invoiceId).select().single()

  if (result.error) {
    throw createError({ statusCode: 500, message: result.error.message })
  }

  return { success: true, data: result.data }
})
