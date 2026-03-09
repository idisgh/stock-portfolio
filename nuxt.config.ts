// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],

  // Vercel 서버리스 배포 설정
  nitro: {
    preset: 'vercel',
  },

  // SSR 프리렌더링 비활성화 (DB 연결 필요한 페이지라서)
  routeRules: {
    '/**': { ssr: true },
  },
})
