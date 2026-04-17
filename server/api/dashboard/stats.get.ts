export default defineEventHandler(async () => {
  try {
    const db = useDb()
    const { data: contracts } = await db.from('contracts').select('*')
    const { data: invoices } = await db.from('invoices').select('*')
    const { data: clients } = await db.from('clients').select('*')
    
    return {
      success: true,
      data: {
        total_contracts: contracts?.length || 0,
        total_invoices: invoices?.length || 0,
        total_clients: clients?.length || 0,
        pending_invoices: invoices?.filter(i => i.status === 'pending').length || 0,
      }
    }
  } catch (err) {
    throw createError({ statusCode: 500, message: 'Error' })
  }
})
