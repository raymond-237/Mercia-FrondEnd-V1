import { defineStore } from 'pinia'
import useReturnRequestsService from '~/services/Models/returnrequest.servirce'
import type { ReturnRequestListItem, ReturnRequestDetail } from '~/types/Models/returnRequest.type'

interface PaginationMeta {
  currentPage: number
  lastPage: number
  total: number
}

export const useAdminReturnRequestsStore = defineStore('adminReturnRequests', {
  state: () => ({
    returns: [] as ReturnRequestListItem[],
    currentReturn: null as ReturnRequestDetail | null,
    pagination: null as PaginationMeta | null,
    loading: false,
    actionLoading: false,
  }),

  actions: {
    async fetchReturns(params?: { status?: string; page?: number }): Promise<ReturnRequestListItem[]> {
      this.loading = true
      try {
        const service = useReturnRequestsService()
        const { data, meta } = await service.list(params)
        this.returns = data
        this.pagination = meta?.page
          ? {
              currentPage: meta.page.currentPage,
              lastPage: meta.page.lastPage,
              total: meta.page.total,
            }
          : null
        return data
      } catch (error) {
        console.error('[returns] fetchReturns failed:', error)
        this.returns = []
        this.pagination = null
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchReturnDetail(id: string): Promise<ReturnRequestDetail | null> {
      this.loading = true
      try {
        const service = useReturnRequestsService()
        const result = await service.show(id)
        this.currentReturn = result
        return result
      } catch (error) {
        console.error('[returns] fetchReturnDetail failed:', error)
        this.currentReturn = null
        return null
      } finally {
        this.loading = false
      }
    },

    async approveReturn(id: string, restoreStock: boolean): Promise<boolean> {
      this.actionLoading = true
      try {
        const service = useReturnRequestsService()
        this.currentReturn = await service.approve(id, restoreStock)
        return true
      } catch (error) {
        console.error('[returns] approveReturn failed:', error)
        return false
      } finally {
        this.actionLoading = false
      }
    },

    async rejectReturn(id: string, reason?: string): Promise<boolean> {
      this.actionLoading = true
      try {
        const service = useReturnRequestsService()
        this.currentReturn = await service.reject(id, reason)
        return true
      } catch (error) {
        console.error('[returns] rejectReturn failed:', error)
        return false
      } finally {
        this.actionLoading = false
      }
    },

    async completeReturn(id: string): Promise<boolean> {
      this.actionLoading = true
      try {
        const service = useReturnRequestsService()
        this.currentReturn = await service.complete(id)
        return true
      } catch (error) {
        console.error('[returns] completeReturn failed:', error)
        return false
      } finally {
        this.actionLoading = false
      }
    },
  },
})