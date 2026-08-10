import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({

  compatibilityDate: '2025-07-15',

  devtools: { enabled: false },

  ssr: false,

  typescript: {
    shim: false,
  },

  // ── Modules 

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        config.plugins?.push(vuetify({ autoImport: true }))
      })
    },
    '@sidebase/nuxt-auth',
    // [
    //   '@pinia/nuxt',
    //   { autoImports: ['defineStore', 'acceptHMRUpdate'] },
    // ],
    '@nuxtjs/google-fonts',
    '@vite-pwa/nuxt',
    // '@nuxtjs/i18n'
  ],

  // ── Build 

  build: {
    transpile: ['vuetify'],
  },

  // ── Vite 

  vite: {
    vue: {
      template: { transformAssetUrls },
    },
  },

  // i18n: {
  //     strategy: 'no_prefix',
  //     locales: ['fr', 'en', 'it'],
  //     defaultLocale: 'fr',
  // },

  css: ['vuetify/styles'],

  // ── Auto-imports 

  imports: {
    dirs: [
      '@cores/helpers',
      'stores',
      'composables',
      'services',
    ],
  },

  // ── Google Fonts 

googleFonts: {
  families: {
    Fraunces: [400, 500, 600, 700],
    Inter: [400, 500, 600, 700, 800],
  },
  display: 'swap',
  preload: true,
},
  // ── PWA 

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Afro Extension',
      short_name: 'AfroExt',
      description: 'Extensions capillaires premium pour la diaspora africaine d\'Europe',
      theme_color: '#2B1810',
      background_color: '#F7EFE6',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      lang: 'fr',
      icons: [
        {
          src: 'pwa-64x64.png',
          sizes: '64x64',
          type: 'image/png',
        },
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    
    workbox: {
      maximumFileSizeToCacheInBytes: 10485760,
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'product-images',
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
          },
        },
        {
          urlPattern: /^https?:\/\/.*\/v1\/products.*/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'api-products',
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 10 },
          },
        },
      ],
    },
    strategies: 'generateSW',
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: false,
      type: 'module',
    },
  },

  

  auth: {
    isEnabled: true,
    globalAppMiddleware: false,
    baseURL: process.env.NUXT_API_BASE_URL,
    session: {
      enableRefreshPeriodically: 300000,
      enableRefreshOnWindowFocus: true,
    },
    provider: {
      type: 'local',
      scheme: 'refresh',
      token: {
        signInResponseTokenPointer: '/access_token',
        maxAgeInSeconds: 18000,
        type: 'Bearer',
      },
      refreshToken: {
        signInResponseTokenPointer: '/refresh_token',
        maxAgeInSeconds: 60 * 60 * 24 * 30,
        cookieName: 'auth.refresh-token',
        propertyName: 'refresh_token',
      },
      session: {
        dataResponsePointer: '/',
      },
      endpoints: {
        signIn:     { path: '/auth/login',   method: 'post' },
        signOut:    { path: '/auth/logout',  method: 'post' },
        getSession: { path: '/auth/me',      method: 'get'  },
        refresh:    { path: '/auth/refresh', method: 'post' },
      },
      refreshOnlyToken: false,
      autoLogout: true,
    },
  },

  // ── App head 

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      title: 'Afro Extension — Extensions capillaires premium',
      meta: [
        { name: 'theme-color',                           content: '#2B1810' },
        { name: 'apple-mobile-web-app-capable',           content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style',  content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title',             content: 'Afro Extension' },
        { name: 'description',                            content: 'Extensions capillaires premium pour la diaspora africaine d\'Europe. Qualité Remy, livraison soignée.' },
      ],
      link: [
        { rel: 'icon',             type: 'image/png', href: '/favicon.ico' },
        { rel: 'apple-touch-icon',                    href: '/apple-touch-icon.png' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  // ── Runtime config 

  runtimeConfig: {
    API_HOST:    process.env.NUXT_API_HOST,
    API_BASE_URI: process.env.NUXT_API_BASE_URI,
    public: {
      persistStore:  true,
      APP_NAME:      process.env.NUXT_APP_NAME,
      API_HOST:      process.env.NUXT_API_HOST,
      API_BASE_URI:  process.env.NUXT_API_BASE_URI,
      API_BASE_URL:  process.env.NUXT_API_BASE_URL,
      apiBase:       process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:8000',
    },
  },

  // ── Nitro 

  nitro: {
    serveStatic: true,
    // rollupConfig: {}, 
  },

  sourcemap: { server: false, client: false },

})