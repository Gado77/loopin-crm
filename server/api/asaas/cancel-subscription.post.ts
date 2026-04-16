import { cancelarAssinaturaAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { subscriptionId } = body

  if (!subscriptionId) {
    throw createError({ statusCode: 400, message: 'subscriptionId é obrigatório' })
  }

  const assinatura = await cancelarAssinaturaAsaas(subscriptionId)

  const db = useDb()
  await db
    .from('contracts')
    .update({ status: 'CANCELLED' })
    .eq('asaas_subscription_id', subscriptionId)

  return {
    success: true,
    subscription: assinatura,
    message: 'Assinatura cancelada no Asaas!',
  }
})
