import { defineStore } from 'pinia'
import useInventoryService from '~/services/Models/inventory.service'
import type { InventoryListItem, InventoryDetail } from '~/types/Models/inventory.type'

interface PaginationMeta {
  currentPage: number
  lastPage: number
  total: number
}

export const useAdminInventoryStore = defineStore('adminInventory', {
  state: () => ({
    inventories: [] as InventoryListItem[],
    currentInventory: null as InventoryDetail | null,
    pagination: null as PaginationMeta | null,
    loading: false,
    actionLoading: false,
  }),

  actions: {
    async fetchInventories(params?: { search?: string; page?: number }): Promise<InventoryListItem[]> {
      this.loading = true
      try {
        const service = useInventoryService()
        const { data, meta } = await service.list(params)
        this.inventories = data
        this.pagination = meta?.page
          ? {
              currentPage: meta.page.currentPage,
              lastPage: meta.page.lastPage,
              total: meta.page.total,
            }
          : null
        return data
      } catch (error) {
        console.error('[inventory] fetchInventories failed:', error)
        this.inventories = []
        this.pagination = null
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchInventoryDetail(id: string): Promise<InventoryDetail | null> {
      this.loading = true
      try {
        const service = useInventoryService()
        const result = await service.show(id)
        this.currentInventory = result
        return result
      } catch (error) {
        console.error('[inventory] fetchInventoryDetail failed:', error)
        this.currentInventory = null
        return null
      } finally {
        this.loading = false
      }
    },

    async addStock(id: string, quantity: number, reason?: string): Promise<boolean> {
      this.actionLoading = true
      try {
        const service = useInventoryService()
        const result = await service.addStock(id, quantity, reason)
        this.currentInventory = result
        this.syncListItem(result)
        return true
      } catch (error) {
        console.error('[inventory] addStock failed:', error)
        return false
      } finally {
        this.actionLoading = false
      }
    },

    async removeStock(id: string, quantity: number, reason?: string): Promise<boolean> {
      this.actionLoading = true
      try {
        const service = useInventoryService()
        const result = await service.removeStock(id, quantity, reason)
        this.currentInventory = result
        this.syncListItem(result)
        return true
      } catch (error) {
        console.error('[inventory] removeStock failed:', error)
        return false
      } finally {
        this.actionLoading = false
      }
    },

    async adjust(id: string, quantity: number, reason?: string): Promise<boolean> {
      this.actionLoading = true
      try {
        const service = useInventoryService()
        const result = await service.adjust(id, quantity, reason)
        this.currentInventory = result
        this.syncListItem(result)
        return true
      } catch (error) {
        console.error('[inventory] adjust failed:', error)
        return false
      } finally {
        this.actionLoading = false
      }
    },

    // Garde la liste en mémoire synchronisée après une action rapide
    // sans devoir tout recharger depuis l'API.
    syncListItem(updated: InventoryDetail) {
      const idx = this.inventories.findIndex(i => i.id === updated.id)
      if (idx !== -1) {
        this.inventories[idx] = { ...this.inventories[idx], quantity: updated.quantity, lowStockThreshold: updated.lowStockThreshold }
      }
    },
  },
})