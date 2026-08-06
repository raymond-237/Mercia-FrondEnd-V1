import { acceptHMRUpdate, defineStore } from 'pinia'
import useOrdersAdminService from '~/services/Models/ordersAdmin.services'
import type { OrderDetail, OrderListItem } from '~/types/Models/order.type'

export const useAdminOrdersStore = defineStore('adminOrders', () => {

  const service = useOrdersAdminService()

  const orders          = ref<OrderListItem[]>([])
  const currentOrder    = ref<OrderDetail | null>(null)
  const pagination       = ref<{ currentPage: number; lastPage: number } | null>(null)

  const loading        = ref(false)
  const loadingDetail  = ref(false)
  const actionLoading   = ref(false)
  const error            = ref<string | null>(null)

  async function fetchOrders(params: { page?: number; status?: string; search?: string } = {}) {
    loading.value = true
    error.value    = null
    try {
      const { data, meta } = await service.list(params)
      orders.value    = data ?? []
      pagination.value = meta?.page ?? null
      return orders.value
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de charger les commandes.'
      orders.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchOrderDetail(id: string) {
    loadingDetail.value = true
    error.value           = null
    try {
      currentOrder.value = await service.show(id)
      return currentOrder.value
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Commande introuvable.'
      currentOrder.value = null
      return null
    } finally {
      loadingDetail.value = false
    }
  }

  async function runAction(action: () => Promise<any>) {
    actionLoading.value = true
    error.value            = null
    try {
      await action()
      if (currentOrder.value) await fetchOrderDetail(currentOrder.value.id)
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Action impossible.'
      return false
    } finally {
      actionLoading.value = false
    }
  }

  const confirmOrder    = (id: string) => runAction(() => service.confirm(id))
  const shipOrder        = (id: string, carrierCode: string | null, trackingNumber: string | null) =>
    runAction(() => service.ship(id, carrierCode, trackingNumber))
  const deliverOrder     = (id: string) => runAction(() => service.deliver(id))
  const markAsPaidOrder  = (id: string, note: string) => runAction(() => service.markAsPaid(id, note))
  const cancelOrder      = (id: string, reason?: string) => runAction(() => service.cancel(id, reason))

  return {
    orders, currentOrder, pagination,
    loading, loadingDetail, actionLoading, error,
    fetchOrders, fetchOrderDetail,
    confirmOrder, shipOrder, deliverOrder, markAsPaidOrder, cancelOrder,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAdminOrdersStore, import.meta.hot))
}