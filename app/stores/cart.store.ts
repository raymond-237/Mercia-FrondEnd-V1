import { acceptHMRUpdate, defineStore } from 'pinia'
import useDiscountCodesService from '~/services/Models/discountCodes.services'
import type { CartItemLocal, PromoResult } from '~/types/public/index.type'

const FREE_SHIPPING_THRESHOLD = 90

export const useCartStore = defineStore('cart-store', () => {

  const discountCodesService = useDiscountCodesService()

  // ── State

  const items = ref<CartItemLocal[]>([])
  const promo = ref<PromoResult | null>(null)

  const promoLoading = ref(false)
  const promoError   = ref<string | null>(null)

  // ── Getters

  const subtotal = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
  )
  const discount = computed(() => promo.value?.discountAmount ?? 0)
  const total    = computed(() => Math.max(0, subtotal.value - discount.value))
  const count    = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))

  const freeShippingProgress = computed(() =>
    Math.min(100, (subtotal.value / FREE_SHIPPING_THRESHOLD) * 100)
  )
  const amountUntilFree = computed(() =>
    Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal.value)
  )

  // ── Actions panier

  function addItem(item: Omit<CartItemLocal, 'quantity'>, quantity = 1) {
    if (!item.variantId) {
      console.error('addItem refusé : variantId manquant.', item)
      return
    }

    const existing = items.value.find(i => i.variantId === item.variantId)
    const max = item.maxQuantity ?? Infinity

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, max)
    } else {
      items.value.push({ ...item, quantity: Math.min(Math.max(quantity, item.minQuantity), max) })
    }

    invalidatePromoIfNeeded()
  }

  function updateQty(variantId: string, qty: number) {
    const item = items.value.find(i => i.variantId === variantId)
    if (!item) return
    if (qty < item.minQuantity) { removeItem(variantId); return }
    const max = item.maxQuantity ?? Infinity
    item.quantity = Math.min(qty, max)
    invalidatePromoIfNeeded()
  }

  function removeItem(variantId: string) {
    items.value = items.value.filter(i => i.variantId !== variantId)
    invalidatePromoIfNeeded()
  }

  function clear() {
    items.value = []
    promo.value = null
    promoError.value = null
  }

  // ── Actions promo
  // Le calcul final et faisant foi reste toujours côté backend au
  // moment du checkout (OrderService::checkout) — ce qui suit ne sert
  // qu'à donner un retour immédiat et honnête à l'utilisateur.

  async function applyPromoCode(code: string): Promise<boolean> {
    if (!code.trim()) return false

    promoLoading.value = true
    promoError.value   = null

    try {
      const result = await discountCodesService.validate(
        code.trim().toUpperCase(),
        items.value.map(i => ({
          product_variant_id: i.variantId,
          quantity: i.quantity,
        })),
      )

      promo.value = { code: result.code, discountAmount: result.discountAmount } as PromoResult
      return true
    } catch (e: any) {
      promoError.value = e?.response?.data?.errors?.discount_code?.[0]
        ?? e?.response?.data?.errors?.[0]?.detail
        ?? 'Code invalide ou expiré.'
      promo.value = null
      return false
    } finally {
      promoLoading.value = false
    }
  }

  function removePromo() {
    promo.value = null
    promoError.value = null
  }

  /**
   * Un code appliqué peut devenir invalide après coup : montant minimum
   * plus atteint après retrait d'un article, code ciblant un produit
   * retiré du panier, etc. On invalide localement dès qu'un changement
   * de panier survient, pour ne jamais afficher une remise obsolète —
   * l'utilisateur devra retaper son code, qui sera revalidé à neuf.
   */
  function invalidatePromoIfNeeded() {
    if (promo.value) {
      promo.value = null
      promoError.value = 'Votre panier a changé, merci de réappliquer votre code promo.'
    }
  }

  return {
    // state
    items,
    promo,
    promoLoading,
    promoError,
    // getters
    subtotal,
    discount,
    total,
    count,
    freeShippingProgress,
    amountUntilFree,
    FREE_SHIPPING_THRESHOLD,
    // actions
    addItem,
    updateQty,
    removeItem,
    clear,
    applyPromoCode,
    removePromo,
  }
}, {

  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartStore, import.meta.hot))
}