import { defineStore } from 'pinia'
import useTaxRatesService from '~/services/Models/taxrate.service'
import type { TaxRateListItem, TaxRateFormData } from '~/types/Models/taxRate.type'

export const useAdminTaxRatesStore = defineStore('adminTaxRates', {
  state: () => ({
    rates: [] as TaxRateListItem[],
    currentRate: null as TaxRateListItem | null,
    loading: false,
    saving: false,
    error: null as string | null,
  }),

  actions: {
    async fetchRates(): Promise<TaxRateListItem[]> {
      this.loading = true
      try {
        const service = useTaxRatesService()
        this.rates = await service.list()
        return this.rates
      } catch (e) {
        console.error('[taxRates] fetchRates failed:', e)
        this.rates = []
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchRate(id: string): Promise<TaxRateListItem | null> {
      this.loading = true
      try {
        const service = useTaxRatesService()
        this.currentRate = await service.show(id)
        return this.currentRate
      } catch (e) {
        console.error('[taxRates] fetchRate failed:', e)
        this.currentRate = null
        return null
      } finally {
        this.loading = false
      }
    },

    async createRate(payload: TaxRateFormData): Promise<TaxRateListItem | null> {
      this.saving = true
      this.error  = null
      try {
        const service = useTaxRatesService()
        const created = await service.create(payload)
        if (payload.isDefault) {
          this.rates = this.rates.map(r => ({ ...r, isDefault: false }))
        }
        this.rates.unshift(created)
        return created
      } catch (e: any) {
        this.error = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de créer le taux.'
        return null
      } finally {
        this.saving = false
      }
    },

    async updateRate(id: string, payload: TaxRateFormData): Promise<TaxRateListItem | null> {
      this.saving = true
      this.error  = null
      try {
        const service = useTaxRatesService()
        const updated = await service.update(id, payload)
        if (payload.isDefault) {
          this.rates = this.rates.map(r => ({ ...r, isDefault: r.id === id }))
        } else {
          const idx = this.rates.findIndex(r => r.id === id)
          if (idx !== -1) this.rates[idx] = updated
        }
        return updated
      } catch (e: any) {
        this.error = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de modifier le taux.'
        return null
      } finally {
        this.saving = false
      }
    },

    async deleteRate(id: string): Promise<boolean> {
      try {
        const service = useTaxRatesService()
        await service.remove(id)
        this.rates = this.rates.filter(r => r.id !== id)
        return true
      } catch (e) {
        console.error('[taxRates] deleteRate failed:', e)
        return false
      }
    },
  },
})