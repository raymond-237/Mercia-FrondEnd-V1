
import { acceptHMRUpdate, defineStore } from 'pinia'
import useShippingMethodsService from '~/services/Models/shipping-methods.service'
import useShippingZonesService from '~/services/Models/shipping-zones.service'
import type {
  ShippingZoneFormData, ShippingZoneListItem,
  ShippingMethodFormData, ShippingMethodListItem,
} from '~/types/Models/shipping.type'

export const useShippingStore = defineStore('shipping', () => {

  const zonesService   = useShippingZonesService()
  const methodsService = useShippingMethodsService()

  const zones    = ref<ShippingZoneListItem[]>([])
  const methods   = ref<ShippingMethodListItem[]>([])

  const loading = ref(false)
  const saving   = ref(false)
  const error     = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value    = null
    try {
      const [zonesData, methodsData] = await Promise.all([
        zonesService.list(),
        methodsService.list(),
      ])
      zones.value   = zonesData ?? []
      methods.value = methodsData ?? []
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de charger les données de livraison.'
    } finally {
      loading.value = false
    }
  }

  // ── Zones

  async function createZone(payload: ShippingZoneFormData): Promise<boolean> {
    saving.value = true
    try {
      await zonesService.create(payload)
      await fetchAll()
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de créer la zone.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateZone(id: string, payload: ShippingZoneFormData): Promise<boolean> {
    saving.value = true
    try {
      await zonesService.update(id, payload)
      await fetchAll()
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de modifier la zone.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteZone(id: string): Promise<boolean> {
    try {
      await zonesService.remove(id)
      zones.value = zones.value.filter(z => z.id !== id)
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de supprimer la zone.'
      return false
    }
  }

  // ── Méthodes

  async function createMethod(payload: ShippingMethodFormData): Promise<boolean> {
    saving.value = true
    try {
      await methodsService.create(payload)
      await fetchAll()
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de créer la méthode.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateMethod(id: string, payload: ShippingMethodFormData): Promise<boolean> {
    saving.value = true
    try {
      await methodsService.update(id, payload)
      await fetchAll()
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de modifier la méthode.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteMethod(id: string): Promise<boolean> {
    try {
      await methodsService.remove(id)
      methods.value = methods.value.filter(m => m.id !== id)
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de supprimer la méthode.'
      return false
    }
  }

  return {
    zones, methods, loading, saving, error,
    fetchAll,
    createZone, updateZone, deleteZone,
    createMethod, updateMethod, deleteMethod,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useShippingStore, import.meta.hot))
}