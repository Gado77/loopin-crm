export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const db = useDb()
    
    const { data: client } = await db.from('clients').insert({
      id: crypto.randomUUID(),
      name: body.name,
      email: body.email,
      phone: body.phone,
      cpf_cnpj: body.cpf_cnpj,
    }).select().single()
    
    return { success: true, data: client }
  } catch (err) {
    throw createError({ statusCode: 500, message: 'Error creating client' })
  }
})
