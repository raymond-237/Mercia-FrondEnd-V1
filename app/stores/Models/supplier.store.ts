import { acceptHMRUpdate, defineStore } from 'pinia'
import useSuppliersService from '~/services/Models/supplier.service'
import type { Supplier, SupplierFormData } from '~/services/Models/suppliers.service'

export const useSuppliersStore = defineStore('suppliers', () => {

  const service = useSuppliersService()

  const suppliers = ref<Supplier[]>([])
  const loading    = ref(false)
  const saving     = ref(false)
  const error      = ref<string | null>(null)

  async function fetchSuppliers(search?: string) {
    loading.value = true
    error.value    = null
    try {
      suppliers.value = await service.list(search)
      return suppliers.value
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de charger les fournisseurs.'
      suppliers.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  async function createSupplier(payload: SupplierFormData): Promise<boolean> {
    saving.value = true
    error.value   = null
    try {
      const created = await service.create(payload)
      suppliers.value.push(created)
      suppliers.value.sort((a, b) => a.name.localeCompare(b.name))
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de créer le fournisseur.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateSupplier(id: string, payload: SupplierFormData): Promise<boolean> {
    saving.value = true
    error.value   = null
    try {
      const updated = await service.update(id, payload)
      const idx = suppliers.value.findIndex(s => s.id === id)
      if (idx !== -1) suppliers.value[idx] = updated
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de modifier le fournisseur.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteSupplier(id: string): Promise<boolean> {
    saving.value = true
    error.value   = null
    try {
      await service.remove(id)
      suppliers.value = suppliers.value.filter(s => s.id !== id)
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de supprimer le fournisseur.'
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    suppliers, loading, saving, error,
    fetchSuppliers, createSupplier, updateSupplier, deleteSupplier,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSuppliersStore, import.meta.hot))
}