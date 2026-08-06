import { defineStore } from 'pinia'
import useDiscountCodesService from '~/services/Models/discountCodes.services'
import type { DiscountCodeListItem, DiscountCodeFormData } from '~/types/Models/discountCode.type'

interface PaginationMeta {
  currentPage: number
  lastPage: number
  total: number
}

export const useAdminDiscountCodesStore = defineStore('adminDiscountCodes', {
  state: () => ({
    codes: [] as DiscountCodeListItem[],
    currentCode: null as DiscountCodeListItem | null,
    pagination: null as PaginationMeta | null,
    loading: false,
    saving: false,
    error: null as string | null,
  }),

  actions: {
    async fetchCodes(params?: { search?: string; status?: string; page?: number }): Promise<DiscountCodeListItem[]> {
      this.loading = true
      try {
        const service = useDiscountCodesService()
        const { data, meta } = await service.list(params)
        this.codes = data
        this.pagination = meta?.page
          ? { currentPage: meta.page.currentPage, lastPage: meta.page.lastPage, total: meta.page.total }
          : null
        return data
      } catch (e) {
        console.error('[discountCodes] fetchCodes failed:', e)
        this.codes = []
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchCode(id: string): Promise<DiscountCodeListItem | null> {
      this.loading = true
      try {
        const service = useDiscountCodesService()
        this.currentCode = await service.show(id)
        return this.currentCode
      } catch (e) {
        console.error('[discountCodes] fetchCode failed:', e)
        this.currentCode = null
        return null
      } finally {
        this.loading = false
      }
    },

    async createCode(payload: DiscountCodeFormData): Promise<DiscountCodeListItem | null> {
      this.saving = true
      this.error  = null
      try {
        const service = useDiscountCodesService()
        return await service.create(payload)
      } catch (e: any) {
        this.error = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de créer le code promo.'
        return null
      } finally {
        this.saving = false
      }
    },

    async updateCode(id: string, payload: DiscountCodeFormData): Promise<DiscountCodeListItem | null> {
      this.saving = true
      this.error  = null
      try {
        const service = useDiscountCodesService()
        return await service.update(id, payload)
      } catch (e: any) {
        this.error = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de modifier le code promo.'
        return null
      } finally {
        this.saving = false
      }
    },

    async deleteCode(id: string): Promise<boolean> {
      try {
        const service = useDiscountCodesService()
        await service.remove(id)
        this.codes = this.codes.filter(c => c.id !== id)
        return true
      } catch (e) {
        console.error('[discountCodes] deleteCode failed:', e)
        return false
      }
    },

    async generateCode(): Promise<string> {
      const service = useDiscountCodesService()
      return await service.generateCode()
    },

    async toggleActive(id: string): Promise<boolean> {
      try {
        const service = useDiscountCodesService()
        const updated = await service.toggleActive(id)
        const idx = this.codes.findIndex(c => c.id === id)
        if (idx !== -1 && updated) this.codes[idx] = updated
        return true
      } catch (e) {
        console.error('[discountCodes] toggleActive failed:', e)
        return false
      }
    },
  },
})