// Vercel rebuild trigger
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: true,

  modules: [
    '@nuxt/ui',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Loopin CRM',
      meta: [
        { name: 'description', content: 'Sistema de gestão financeira Loopin' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.JWT_SECRET,
    asaasApiKey: process.env.ASAAS_API_KEY,
    asaasWebhookSecret: process.env.ASAAS_WEBHOOK_SECRET,
    loopinTvFunctionsUrl: process.env.LOOPIN_TV_FUNCTIONS_URL,
    loopinTvServiceRoleKey: process.env.LOOPIN_TV_SERVICE_ROLE_KEY,
    cronSecret: process.env.CRON_SECRET,
    crmApiKey: process.env.CRM_API_KEY,
    public: {
      appName: 'Loopin CRM'
    }
  },

  compatibilityDate: '2025-01-01',

  nitro: {
    preset: 'vercel',
    compressPublicAssets: true,
    minify: true
  },

  experimental: {
    payloadExtraction: false
  }
})
