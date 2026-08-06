import { acceptHMRUpdate, defineStore } from 'pinia'
import useReturnsService, { type ReturnSubmitPayload } from '~/services/Models/returns.service'

export const useReturnsStore = defineStore('returns', () => {

  const returnsService = useReturnsService()

  // ── State — remplace les sessionStorage manuels ('return_access_token', 'return_order')

  const accessToken = ref<string | null>(null)
  const expiresAt     = ref<number | null>(null) // timestamp ms
  const order          = ref<any>(null)

  const loading    = ref(false)
  const submitting = ref(false)
  const error        = ref<string | null>(null)

  // ── Getters

  const isTokenValid = computed(() =>
    !!accessToken.value && !!expiresAt.value && Date.now() < expiresAt.value
  )

  // ── Actions

  async function lookupOrder(orderNumber: string, email: string): Promise<boolean> {
    loading.value = true
    error.value    = null

    try {
      const result = await returnsService.lookup(orderNumber, email)

      if (!result.accessToken) {
        error.value = 'Aucune commande trouvée avec ces informations.'
        return false
      }

      accessToken.value = result.accessToken
      expiresAt.value   = Date.now() + (result.expiresIn ?? 1800) * 1000 // fallback 30 min
      order.value         = result.order
      return true
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Aucune commande trouvée avec ces informations.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function submitReturn(payload: ReturnSubmitPayload) {
    if (!isTokenValid.value || !accessToken.value) {
      error.value = 'Session expirée — veuillez rechercher votre commande à nouveau.'
      return null
    }

    submitting.value = true
    error.value        = null

    try {
      const result = await returnsService.submit(payload, accessToken.value)
      clear() // token à usage unique — on nettoie après succès
      return result
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? "Impossible d'envoyer la demande de retour."
      return null
    } finally {
      submitting.value = false
    }
  }

  function clear() {
    accessToken.value = null
    expiresAt.value     = null
    order.value           = null
  }

  return {
    accessToken, expiresAt, order,
    loading, submitting, error,
    isTokenValid,
    lookupOrder, submitReturn, clear,
  }
}, {
  // Persisté en sessionStorage (pas localStorage) : le token expire après
  // 30 min et ne doit pas survivre à la fermeture de l'onglet, cohérent
  // avec le comportement d'origine en sessionStorage manuel.
  persist: {
    storage: sessionStorage,
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReturnsStore, import.meta.hot))
}