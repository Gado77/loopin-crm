export default defineEventHandler(async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      asaas_subscription: 'POST /api/asaas/create-subscription',
      asaas_payment: 'POST /api/asaas/create-payment',
      asaas_customer: 'POST /api/asaas/create-customer',
      asaas_subscriptions: 'GET /api/asaas/subscriptions',
      contracts: 'GET /api/contracts',
      invoices: 'GET /api/invoices',
    },
    environment: {
      node: process.version,
      vercel: !!process.env.VERCEL,
    },
  }
})
