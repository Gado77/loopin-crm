export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
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
    jwtSecret: process.env.JWT_SECRET,
    public: {
      appName: 'Loopin CRM'
    }
  },

  compatibilityDate: '2025-01-01',

  nitro: {
    preset: 'vercel'
  }
})
