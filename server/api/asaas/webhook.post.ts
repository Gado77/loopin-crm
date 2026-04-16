import { mapearStatusAsaas } from '../../utils/asaas'
import { useDb } from '../../utils/db'

const WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  const eventType = body.event
  
  if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
    const paymentData = body.payment
    
    if (paymentData?.externalReference) {
      const { data: invoice, error } = await db
        .from('invoices')
        .select('id, status')
        .eq('id', paymentData.externalReference)
        .single()

      if (!error && invoice && invoice.status !== 'paid') {
        await db
          .from('invoices')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: paymentData.billingType
          })
          .eq('id', invoice.id)
      }
    }
  }

  if (eventType === 'PAYMENT_UPDATED') {
    const paymentData = body.payment
    const newStatus = mapearStatusAsaas(paymentData.status)

    if (paymentData?.externalReference) {
      await db
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', paymentData.externalReference)
    }
  }

  return { success: true }
})
