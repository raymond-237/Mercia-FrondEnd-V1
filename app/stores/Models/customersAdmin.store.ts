import { defineStore } from 'pinia'
import useCustomersService from '~/services/Models/customer.service'
import type { CustomerListItem, CustomerDetail } from '~/types/Models/customer.type'

interface PaginationMeta {
  currentPage: number
  lastPage: number
  total: number
}

export const useAdminCustomersStore = defineStore('adminCustomers', {
  state: () => ({
    customers: [] as CustomerListItem[],
    currentCustomer: null as CustomerDetail | null,
    pagination: null as PaginationMeta | null,
    loading: false,
  }),

  actions: {
    async fetchCustomers(params?: { search?: string; page?: number }): Promise<CustomerListItem[]> {
      this.loading = true
      try {
        const service = useCustomersService()
        const { data, meta } = await service.list(params)
        this.customers = data
        this.pagination = meta?.page
          ? {
              currentPage: meta.page.currentPage,
              lastPage: meta.page.lastPage,
              total: meta.page.total,
            }
          : null
        return data
      } catch (error) {
        console.error('[customers] fetchCustomers failed:', error)
        this.customers = []
        this.pagination = null
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchCustomerDetail(id: string): Promise<CustomerDetail | null> {
      this.loading = true
      try {
        const service = useCustomersService()
        const customer = await service.show(id)
        this.currentCustomer = customer
        return customer
      } catch (error) {
        console.error('[customers] fetchCustomerDetail failed:', error)
        this.currentCustomer = null
        return null
      } finally {
        this.loading = false
      }
    },
  },
})