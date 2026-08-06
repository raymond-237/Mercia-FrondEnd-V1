import { acceptHMRUpdate, defineStore } from 'pinia'
import useInvoicesAdminService from '~/services/Models/invoicesadmin.service'
import type { InvoiceData } from '~/types/Models/invoice.type'

export const useAdminInvoiceStore = defineStore('adminInvoice', () => {

  const service = useInvoicesAdminService()

  const invoice  = ref<InvoiceData | null>(null)
  const loading  = ref(false)
  const notFound = ref(false)
  const error    = ref<string | null>(null)

  const downloading = ref(false)
  const sharing      = ref(false)

  async function fetchForOrder(orderId: string) {
    loading.value  = true
    notFound.value = false
    error.value    = null
    try {
      invoice.value = await service.forOrder(orderId)
      return invoice.value
    } catch (e: any) {
      // 404 attendu si la commande n'a pas encore été confirmée payée —
      // pas une vraie erreur technique, juste un état à afficher clairement.
      if (e?.response?.status === 404) {
        notFound.value = true
      } else {
        error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de charger la facture.'
      }
      invoice.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function download(): Promise<boolean> {
    if (!invoice.value) return false
    downloading.value = true
    try {
      await service.download(invoice.value.id, `${invoice.value.invoiceNumber}.pdf`)
      return true
    } catch (e) {
      console.error('[invoice] download failed:', e)
      return false
    } finally {
      downloading.value = false
    }
  }

  async function getShareLink(): Promise<string | null> {
    if (!invoice.value) return null
    sharing.value = true
    const url = await service.shareLink(invoice.value.id)
    sharing.value = false
    return url
  }

  return {
    invoice, loading, notFound, error,
    downloading, sharing,
    fetchForOrder, download, getShareLink,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAdminInvoiceStore, import.meta.hot))
}