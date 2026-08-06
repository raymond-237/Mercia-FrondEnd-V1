import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import type { PaymentMethodOption } from '~/types/Models/order.type'

export default function usePaymentMethodsService() {

  /**
   * GET /api/v1/payment-methods?shipping_method_id=...
   * Réponse plate custom (pas JSON:API) — même pattern que pay()/capture()
   * dans orders.service.ts, pas de JsonaDeserialize ici.
   */
  const available = async (shippingMethodId: string): Promise<PaymentMethodOption[]> => {
    const response: AxiosResponse = await request('payment-methods', {
      method: 'get',
      params: { shipping_method_id: shippingMethodId },
    })

    return response.data.data ?? []
  }

  return { available }
}