import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID é obrigatório',
    })
  }

  const db = useDb()
  const { error } = await db
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return { success: true }
})
