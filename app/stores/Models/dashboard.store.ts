import { defineStore } from 'pinia'
import useDashboardService from '~/services/Models/dashdoard.service'
import type { DashboardSummary } from '~/types/Models/security-management/dashboard.type'

export const useAdminDashboardStore = defineStore('adminDashboard', {
  state: () => ({
    summary: null as DashboardSummary | null,
    loading: false,
  }),

  actions: {
    async fetchSummary(period: 'monthly' | 'weekly' = 'monthly'): Promise<DashboardSummary | null> {
      this.loading = true
      try {
        const service = useDashboardService()
        this.summary = await service.summary(period)
        return this.summary
      } catch (e) {
        console.error('[dashboard] fetchSummary failed:', e)
        this.summary = null
        return null
      } finally {
        this.loading = false
      }
    },
  },
})