import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import type { InvoiceData } from '~/types/Models/invoice.type'

export default function useInvoicesAdminService() {

  /**
   * GET /v1/orders/{order}/invoice
   * Facture par COMMANDE — utilisé pour afficher la page de visualisation.
   * 404 attendu si la commande n'a pas encore été confirmée payée.
   */
  const forOrder = async (orderId: string): Promise<InvoiceData> => {
    const response: AxiosResponse = await request(`orders/${orderId}/invoice`, { method: 'get' })
    return response.data?.data
  }

  /**
   * GET /v1/invoices/{invoice}/download
   *
   * Téléchargement en blob plutôt qu'un simple lien/navigation : la route
   * est authentifiée (auth:sanctum), donc un <a href> ou window.open direct
   * n'enverrait pas le token — on passe par axios pour que l'en-tête
   * d'auth suive, puis on déclenche le téléchargement côté client.
   */
  const download = async (invoiceId: string, filename: string): Promise<void> => {
    const response: AxiosResponse = await request(`invoices/${invoiceId}/download`, {
      method: 'get',
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  /**
   * POST /v1/invoices/{invoice}/share-link
   * Renvoie un lien signé valable 24h, à copier/coller (WhatsApp, email...).
   */
  const shareLink = async (invoiceId: string): Promise<string | null> => {
    try {
      const response: AxiosResponse = await request(`invoices/${invoiceId}/share-link`, { method: 'post' })
      return response.data?.data?.url ?? null
    } catch (e) {
      console.error('[invoices] shareLink failed:', e)
      return null
    }
  }

  return { forOrder, download, shareLink }
}