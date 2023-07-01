// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    MUX_TOKEN_ID: '7689496c-bd37-44b6-a105-dfede703988e',
    MUX_TOKEN_SECRET: 'ENTfrQm1MGRhDPn83VljvXaDKh5ypP/uSpiVx5onimBgp4X+cEcBB68i2DPIIU4ga+/pzo0U94r',
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '~/modules/wss.ts',
  ]
})
