import { acceptHMRUpdate, defineStore } from 'pinia'
import useOrdersService from '~/services/Models/orders.service'
import usePaymentMethodsService from '~/services/Models/paymentMethods.service'
import useShippingMethodsService from '~/services/Models/shipping-methods.service'
import type { CheckoutPayload, CheckoutResult, PaymentMethodOption } from '~/types/Models/order.type'
import type { ShippingMethodData } from '~/types/public/index.type'

export const useOrdersStore = defineStore('orders', () => {

  const ordersService          = useOrdersService()
  const shippingMethodsService = useShippingMethodsService()
  const paymentMethodsService  = usePaymentMethodsService()

  // ── State

  const shippingMethods = ref<ShippingMethodData[]>([])
  const paymentMethods  = ref<PaymentMethodOption[]>([])
  const lastOrder        = ref<CheckoutResult | null>(null)

  const loadingShipping  = ref(false)
  const loadingPayment   = ref(false)
  const submitting       = ref(false)
  const error             = ref<string | null>(null)

  // ── Actions

  async function fetchShippingMethods(params: { country?: string; subtotal?: number } = {}) {
    loadingShipping.value = true
    try {
      const data = await shippingMethodsService.available(params)
      shippingMethods.value = data ?? []
      return shippingMethods.value
    } catch (e) {
      console.error('Erreur chargement méthodes de livraison:', e)
      shippingMethods.value = []
      return []
    } finally {
      loadingShipping.value = false
    }
  }

  /**
   * Chargé une fois la méthode de livraison choisie (étape 3 → 4) — les
   * moyens de paiement disponibles en dépendent (PaymentMethodResolver
   * côté backend croise tenant.settings.payments + shippingMethod).
   */
  async function fetchPaymentMethods(shippingMethodId: string) {
    loadingPayment.value = true
    try {
      const data = await paymentMethodsService.available(shippingMethodId)
      paymentMethods.value = data ?? []
      return paymentMethods.value
    } catch (e) {
      console.error('Erreur chargement moyens de paiement:', e)
      paymentMethods.value = []
      return []
    } finally {
      loadingPayment.value = false
    }
  }

  async function submitCheckout(payload: CheckoutPayload): Promise<CheckoutResult | null> {
    submitting.value = true
    error.value      = null

    try {
      const result = await ordersService.checkout(payload)
      lastOrder.value = result
      return result
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de valider la commande.'
      return null
    } finally {
      submitting.value = false
    }
  }

  async function initiatePayment(orderId: string) {
    try {
      return await ordersService.pay(orderId)
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible d\'initier le paiement.'
      return null
    }
  }

  async function fetchOrder(orderIdOrNumber: string) {
    try {
      return await ordersService.show(orderIdOrNumber)
    } catch (e) {
      console.error('Erreur chargement commande:', e)
      return null
    }
  }

   async function captureOrder(orderIdOrNumber: string) {
    try {
      return await ordersService.capture(orderIdOrNumber)
    } catch (e) {
      console.error('Erreur chargement commande:', e)
      return null
    }
  }

  const trackingError = ref<string | null>(null)

  async function fetchOrderTracking(orderNumber: string, email: string) {
    trackingError.value = null
    try {
      return await ordersService.lookup(orderNumber, email)
    } catch (e: any) {
      trackingError.value = e?.response?.data?.errors?.[0]?.detail ?? 'Aucune commande trouvée avec ces informations.'
      return null
    }
  }

  return {
    // state
    shippingMethods,
    paymentMethods,
    lastOrder,
    loadingShipping,
    loadingPayment,
    submitting,
    error,
    trackingError,
    // actions
    fetchShippingMethods,
    fetchPaymentMethods,
    submitCheckout,
    initiatePayment,
    fetchOrder,
    fetchOrderTracking,
    captureOrder,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrdersStore, import.meta.hot))
}