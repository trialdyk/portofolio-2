// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/icon'],
  css: ['~/assets/css/main.css'],
  // Used by the SPA fallback pages (200.html / 404.html); the prerendered index renders its own boot screen.
  spaLoadingTemplate: 'spa-loading-template.html',
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#000000' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/windows.svg' },
        { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
  nitro: {
    prerender: {
      routes: ['/'],
    },
  },
  icon: {
    provider: 'iconify',
    clientBundle: {
      scan: { globInclude: ['app/**/*.{vue,ts}'] },
      sizeLimitKb: 1024,
    },
  },
})
