import { defineStore } from 'pinia'
import useSettingsService from '~/services/Models/settings.service'
import type {
  TenantSettings,
  GeneralFormData,
  ShopFormData,
  PaymentFormData,
  NotificationsFormData,
  ChangePasswordFormData,
  TeamMember,
  HeroSlide,
} from '~/types/Models/settings.type'

export const useAdminSettingsStore = defineStore('adminSettings', {
  state: () => ({
    settings: null as TenantSettings | null,
    team: [] as TeamMember[],
    loading: false,
    saving: false,
    error: null as string | null,
  }),

  actions: {
    async fetchSettings(): Promise<TenantSettings | null> {
      this.loading = true
      try {
        const service = useSettingsService()
        this.settings = await service.get()
        return this.settings
      } catch (e) {
        console.error('[settings] fetchSettings failed:', e)
        this.settings = null
        return null
      } finally {
        this.loading = false
      }
    },

    async saveGeneral(payload: GeneralFormData): Promise<boolean> {
      this.saving = true
      this.error  = null
      try {
        const service = useSettingsService()
        await service.updateGeneral(payload)
        if (this.settings) Object.assign(this.settings, payload)
        return true
      } catch (e: any) {
        this.error = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de sauvegarder.'
        return false
      } finally {
        this.saving = false
      }
    },

    async uploadLogo(file: File): Promise<boolean> {
      this.saving = true
      try {
        const service = useSettingsService()
        const url = await service.uploadLogo(file)
        if (this.settings) this.settings.logoUrl = url
        return true
      } catch (e) {
        console.error('[settings] uploadLogo failed:', e)
        return false
      } finally {
        this.saving = false
      }
    },

    async saveShop(payload: ShopFormData): Promise<boolean> {
      this.saving = true
      this.error  = null
      try {
        const service = useSettingsService()
        await service.updateShop(payload)
        if (this.settings) {
          this.settings.email = payload.email
          this.settings.phone = payload.phone
          this.settings.shop  = { ...this.settings.shop, ...payload }
        }
        return true
      } catch (e: any) {
        this.error = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de sauvegarder.'
        return false
      } finally {
        this.saving = false
      }
    },

    async savePayment(payload: PaymentFormData): Promise<boolean> {
      this.saving = true
      this.error  = null
      try {
        const service = useSettingsService()
        await service.updatePayment(payload)
        if (this.settings) {
          this.settings.payment = {
            paypalClientId: payload.paypalClientId,
            paypalConfigured: !!payload.paypalSecret || this.settings.payment.paypalConfigured,
            activeMethods: payload.activeMethods,
          }
        }
        return true
      } catch (e: any) {
        this.error = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de sauvegarder.'
        return false
      } finally {
        this.saving = false
      }
    },

    // ── Hero carousel 
    async saveHeroSlides(slides: HeroSlide[]): Promise<boolean> {
      this.saving = true
      this.error  = null
      try {
        const service = useSettingsService()

        // sourceType est un détail d'UI (upload vs URL), le backend n'a
        // besoin que de imageUrl. Les slides ajoutées côté client portent
        // un id temporaire ("new-...") : on ne l'envoie pas, le backend
        // génère le vrai id (ULID) à la création.
        const payload = {
          slides: slides.map(({ id, sourceType, ...rest }) => ({
            ...rest,
            ...(id && !id.startsWith('new-') ? { id } : {}),
          })),
        }

        const updated = await service.updateHeroSlides(payload)
        if (this.settings) {
          this.settings.hero = { slides: updated?.slides ?? slides }
        }
        return true
      } catch (e: any) {
        this.error = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de sauvegarder.'
        return false
      } finally {
        this.saving = false
      }
    },

    // Upload d'une seule image de slide — volontairement séparé de `saving`
    // (qui pilote le bouton "Enregistrer" global) pour ne pas bloquer tout
    // le formulaire pendant qu'une slide upload son image en arrière-plan.
    async uploadHeroImage(file: File): Promise<string | null> {
      try {
        const service = useSettingsService()
        return await service.uploadHeroImage(file)
      } catch (e) {
        console.error('[settings] uploadHeroImage failed:', e)
        return null
      }
    },

    async saveNotifications(payload: NotificationsFormData): Promise<boolean> {
      this.saving = true
      this.error  = null
      try {
        const service = useSettingsService()
        await service.updateNotifications(payload)
        if (this.settings) this.settings.notifications = { ...payload }
        return true
      } catch (e: any) {
        this.error = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de sauvegarder.'
        return false
      } finally {
        this.saving = false
      }
    },

    async changePassword(payload: ChangePasswordFormData): Promise<boolean> {
      this.saving = true
      this.error  = null
      try {
        const service = useSettingsService()
        await service.changePassword(payload)
        return true
      } catch (e: any) {
        this.error = e?.response?.data?.errors?.[0]?.detail ?? 'Mot de passe actuel incorrect ou requête invalide.'
        return false
      } finally {
        this.saving = false
      }
    },

    async toggle2fa(): Promise<boolean | null> {
      try {
        const service = useSettingsService()
        const result = await service.toggle2fa()
        return result.is2faEnabled
      } catch (e) {
        console.error('[settings] toggle2fa failed:', e)
        return null
      }
    },

    async fetchTeam(): Promise<TeamMember[]> {
      this.loading = true
      try {
        const service = useSettingsService()
        this.team = await service.fetchTeam()
        return this.team
      } catch (e) {
        console.error('[settings] fetchTeam failed:', e)
        this.team = []
        return []
      } finally {
        this.loading = false
      }
    },
  },
})