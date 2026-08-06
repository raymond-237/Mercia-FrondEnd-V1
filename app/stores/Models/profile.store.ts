import { defineStore } from 'pinia'
import useProfileService from '~/services/Models/profile.service'
import type { ProfileData, ProfileFormData } from '~/types/Models/security-management/profile.type'

export const useAdminProfileStore = defineStore('adminProfile', {
  state: () => ({
    profile: null as ProfileData | null,
    loading: false,
    saving: false,
    uploadingAvatar: false,
    error: null as string | null,
  }),

  actions: {
    async fetchProfile(): Promise<ProfileData | null> {
      this.loading = true
      try {
        const service = useProfileService()
        this.profile = await service.get()
        return this.profile
      } catch (e) {
        console.error('[profile] fetchProfile failed:', e)
        this.profile = null
        return null
      } finally {
        this.loading = false
      }
    },

    async updateProfile(payload: ProfileFormData): Promise<boolean> {
      this.saving = true
      this.error  = null
      try {
        const service = useProfileService()
        await service.update(payload)
        if (this.profile) Object.assign(this.profile, payload)
        return true
      } catch (e: any) {
        this.error = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de sauvegarder.'
        return false
      } finally {
        this.saving = false
      }
    },

    async uploadAvatar(file: File): Promise<boolean> {
      this.uploadingAvatar = true
      try {
        const service = useProfileService()
        const url = await service.uploadAvatar(file)
        if (this.profile) this.profile.avatarUrl = url
        return true
      } catch (e) {
        console.error('[profile] uploadAvatar failed:', e)
        return false
      } finally {
        this.uploadingAvatar = false
      }
    },
  },
})