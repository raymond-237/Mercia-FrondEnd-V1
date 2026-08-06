import type { AxiosResponse } from 'axios'
import { ORDERS } from '~/@cores/constantes/apiresource'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize, JsonaSerialize, toSnakeCase } from '~/@cores/jsonabuilder'
import type { CheckoutPayload, CheckoutResult } from '~/types/Models/order.type'

export default function useOrdersService() {

  /**
   * POST /api/v1/orders/checkout
   * Transaction unique et définitive côté backend — crée le user (ou le
   * retrouve), valide chaque ligne, décompte le stock, crée la commande.
   * Pas d'appel "à blanc" possible : le total réel n'est connu qu'après soumission.
   *
   * Réponse : { id, orderNumber, status, total } uniquement — le controller
   * ne renvoie pas le détail des lignes/adresse, juste la confirmation.
   */
  const checkout = async (payload: CheckoutPayload): Promise<CheckoutResult> => {
    const data = toSnakeCase(payload)

    const response: AxiosResponse = await request('orders/checkout', {
      method: 'post',
      data,
    })

    return JsonaDeserialize<CheckoutResult>(response.data)
  }

  /**
   * POST /api/v1/orders/lookup
   * Retrouve une commande sans compte client, par numéro + email.
   * Réponse plate custom (pas JSON:API, pas de type/id/attributes) —
   * même pattern que pay()/capture(), pas de JsonaDeserialize ici.
   * carrierCode brut renvoyé — trackingUrl est reconstruite côté frontend
   * via buildTrackingUrl() (carriers.ts), pas dupliquée côté backend.
   */
  const lookup = async (orderNumber: string, email: string) => {
    const data = toSnakeCase({ orderNumber, email })

    const response: AxiosResponse = await request('orders/lookup', {
      method: 'post',
      data,
    })

    return response.data.data as {
      orderNumber: string
      status: string
      trackingNumber: string | null
      carrierCode: string | null
    }
  }

  /**
   * POST /api/v1/orders/{order}/pay
   */
  const pay = async (orderId: string): Promise<{ redirectUrl: string }> => {
    const response: AxiosResponse = await request(`orders/${orderId}/pay`, {
      method: 'post',
    })

    // Réponse plate custom, pas JSON:API — pas de JsonaDeserialize ici.
    const data = response.data.data

    return {
      redirectUrl: data.approve_url,
    }
  }

  /**
   * GET /api/v1/orders/{order}
   * Utilisé sur la page de confirmation pour récupérer le détail complet
   * (items, adresse, totaux) — checkout() ne les renvoie pas.
   */
  const show = async (orderNumber: string) => {
    const response = await request('orders', {
      method: 'get',
      params: {
        'filter[orderNumber]': orderNumber,
        include: 'items',
      },
    })

    const raw = JsonaDeserialize<any[]>(response.data) ?? []
    const order = Array.isArray(raw) ? raw[0] : raw

    return order
  }

  const capture = async (orderId: string) => {
    const response = await request(`orders/${orderId}/capture`, { method: 'post' })
    return response.data.data
  }

  return {
    checkout,
    pay,
    show,
    lookup,
    capture,
  }
}