import type { CategoryData } from '~/types/public/index.type'
import type { CategoryFormData } from '~/types/Models/category.type'
import { acceptHMRUpdate, defineStore } from 'pinia'
import useCategoriesService from '~/services/Models/categories.service'

export const useCategoriesStore = defineStore('categories', () => {

  const categoriesService = useCategoriesService()

  const categories = ref<CategoryData[]>([])
  const loading     = ref(false)
  const saving       = ref(false)
  const error         = ref<string | null>(null)

  async function fetchCategories(): Promise<CategoryData[]> {
    loading.value = true
    error.value    = null
    try {
      const data = await categoriesService.list()
      categories.value = data ?? []
      return categories.value
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de charger les catégories.'
      categories.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  // Après création/édition, la réponse du POST/PATCH est en snake_case brut
  // (pas via le Schema) — plutôt que de s'y fier, on refetch la liste propre.
  async function createCategory(payload: CategoryFormData): Promise<boolean> {
    saving.value = true
    error.value    = null
    try {
      await categoriesService.create(payload)
      await fetchCategories()
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de créer la catégorie.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateCategory(id: string, payload: CategoryFormData): Promise<boolean> {
    saving.value = true
    error.value    = null
    try {
      await categoriesService.update(id, payload)
      await fetchCategories()
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de modifier la catégorie.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteCategory(id: string): Promise<boolean> {
    try {
      await categoriesService.remove(id)
      categories.value = categories.value.filter(c => c.id !== id)
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de supprimer la catégorie.'
      return false
    }
  }

  return {
    categories,
    loading,
    saving,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCategoriesStore, import.meta.hot))
}