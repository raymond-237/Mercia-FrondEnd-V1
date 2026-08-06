import { Icon, addCollection } from '@iconify/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('Icon', Icon)
})