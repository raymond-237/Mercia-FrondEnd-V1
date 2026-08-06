import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { darkTheme } from '~/@cores/constantes/Themes/dark'
import { lightTheme } from '~/@cores/constantes/Themes/light'
import VueTablerIcons from "vue-tabler-icons";
import "@mdi/font/css/materialdesignicons.css";



export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    blueprint: md3,
    components,
    directives,

    theme: {
      defaultTheme: 'light',
      themes: {
        light: lightTheme,
        dark:  darkTheme,
      },
    },

    defaults: {
      VBtn: {
        style: 'text-transform: none; letter-spacing: 0;',
        rounded: 'pill',
      },
      VTextField: {
        variant: 'solo-filled',
        flat: true,
        rounded: 'lg',
        density: 'comfortable',
        hideDetails: 'auto',
      },
      VSelect: {
        variant: 'solo-filled',
        flat: true,
        rounded: 'lg',
        density: 'comfortable',
        hideDetails: 'auto',
      },
      VTextarea: {
        variant: 'solo-filled',
        flat: true,
        rounded: 'lg',
        density: 'comfortable',
        hideDetails: 'auto',
      },
      VChip: {
        rounded: 'pill',
      },
    },
  })

  app.vueApp.use(vuetify)
})