import { acceptHMRUpdate, defineStore } from 'pinia'
import useAddressService, { type AddressSuggestion } from '~/services/adresse.service'

export const useAddressStore = defineStore('address', () => {

  const addressService = useAddressService()

  // ── State

  const suggestions = ref<AddressSuggestion[]>([])
  const loading      = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // ── Actions

  /**
   * Recherche débouncée — un appel réseau au plus tous les 350ms
   * pendant la frappe, pas un appel par caractère tapé.
   */
  function search(query: string) {
    if (debounceTimer) clearTimeout(debounceTimer)

    if (query.trim().length < 4) {
      suggestions.value = []
      loading.value = false
      return
    }

    loading.value = true
    debounceTimer = setTimeout(async () => {
      suggestions.value = await addressService.search(query)
      loading.value = false
    }, 350)
  }

  function clear() {
    if (debounceTimer) clearTimeout(debounceTimer)
    suggestions.value = []
    loading.value = false
  }

  return {
    suggestions,
    loading,
    search,
    clear,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAddressStore, import.meta.hot))
}