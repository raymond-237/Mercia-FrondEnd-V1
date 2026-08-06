import { createI18n } from 'vue-i18n'
import { DEFAULT_LOCALE, staticMessages } from '~/@cores/constantes/translations'

export default defineNuxtPlugin(({ vueApp }) => {
    const i18n = createI18n({
        legacy: false,
        globalInjection: true,
        locale: DEFAULT_LOCALE,
        fallbackLocale: DEFAULT_LOCALE,
        messages: staticMessages,
        silentTranslationWarn: process.env.NODE_ENV === 'production',
    })

    vueApp.use(i18n)
})