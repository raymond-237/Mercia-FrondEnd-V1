import type { FilterState } from '~/types/public/index.type'
import { useCartStore } from '~/stores/cart.store'
import { storeToRefs } from 'pinia'

export interface ColorFacet {
  label: string
  hex: string
}

export type SortOption = 'position' | 'price' | '-price' | '-createdAt'

export const useStorefront = () => {

  // ── Panier — délégué au store Pinia (cart.store.ts)

  const cart = useCartStore()
  const {
    items: cartItems,
    promo,
    promoLoading,
    promoError,
    subtotal: cartSubtotal,
    discount: cartDiscount,
    total: cartTotal,
    count: cartCount,
    freeShippingProgress,
    amountUntilFree,
    FREE_SHIPPING_THRESHOLD,
  } = storeToRefs(cart)

  // ── UI

  const activeDrawer = useState<'cart' | 'filters' | null>('sf:drawer', () => null)
  const isDark       = useState<boolean>('sf:dark', () => false)
  const locale       = useState<'fr' | 'it'>('sf:locale', () => 'fr')

  const openCart    = () => { activeDrawer.value = 'cart' }
  const openFilters = () => { activeDrawer.value = 'filters' }
  const closeDrawer = () => { activeDrawer.value = null }

  const toggleTheme = () => { isDark.value = !isDark.value }
  const setLocale   = (l: 'fr' | 'it') => { locale.value = l }

  // ── Panier — actions

  const addToCart = (item: Parameters<typeof cart.addItem>[0], quantity?: number) => {
    cart.addItem(item, quantity)
    openCart()
  }
  const updateQty      = cart.updateQty
  const removeFromCart = cart.removeItem
  const clearCart       = cart.clear
  const applyPromoCode  = cart.applyPromoCode
  const removePromo     = cart.removePromo

  // ── Wishlist — inchangé

  const wishlist    = useState<string[]>('sf:wishlist', () => [])
  const isWishlisted = (id: string) => wishlist.value.includes(id)
  const toggleWishlist = (id: string) => {
    const idx = wishlist.value.indexOf(id)
    if (idx === -1) wishlist.value.push(id)
    else wishlist.value.splice(idx, 1)
  }

  // ── Filtres
  // Trois filtres réels seulement : couleur (dérivée des vraies
  // variantes), prix (attribut numérique natif), tri (déjà supporté
  // par le Schema JSON:API). Longueur/texture retirés : aucune donnée
  // structurée n'existe côté backend pour l'instant.

  const filters = useState<FilterState>('sf:filters', () => ({
    length: [], texture: [], color: [],
  }))

  const availableColors = useState<ColorFacet[]>('sf:availableColors', () => [])
  const setAvailableColors = (colors: ColorFacet[]) => { availableColors.value = colors }

  const priceBounds = useState<{ min: number; max: number } | null>('sf:priceBounds', () => null)
  const setPriceBounds = (bounds: { min: number; max: number }) => { priceBounds.value = bounds }

  const priceRange = useState<[number, number] | null>('sf:priceRange', () => null)
  const setPriceRange = (range: [number, number] | null) => { priceRange.value = range }

  const sortBy = useState<SortOption>('sf:sortBy', () => 'position')
  const setSortBy = (s: SortOption) => { sortBy.value = s }

  const activeFiltersCount = computed(() =>
    filters.value.color.length +
    (priceRange.value ? 1 : 0)
  )

  const toggleFilter = (cat: keyof FilterState, val: string) => {
    const list = filters.value[cat]
    const idx  = list.indexOf(val)
    if (idx === -1) list.push(val)
    else list.splice(idx, 1)
  }

  const resetFilters = () => {
    filters.value  = { length: [], texture: [], color: [] }
    priceRange.value = null
    sortBy.value     = 'position'
  }

  // ── Checkout step — inchangé

  const checkoutStep = useState<1 | 2 | 3 | 4>('sf:step', () => 1)

  return {
    // ui
    activeDrawer, isDark, locale,
    openCart, openFilters, closeDrawer,
    toggleTheme, setLocale,
    // cart
    cartItems, promo, promoLoading, promoError,
    cartSubtotal, cartDiscount, cartTotal, cartCount,
    freeShippingProgress, amountUntilFree,
    FREE_SHIPPING_THRESHOLD,
    addToCart, updateQty, removeFromCart, clearCart,
    applyPromoCode, removePromo,
    // wishlist
    wishlist, isWishlisted, toggleWishlist,
    // filters
    filters, availableColors, setAvailableColors,
    priceBounds, setPriceBounds, priceRange, setPriceRange,
    sortBy, setSortBy,
    activeFiltersCount, toggleFilter, resetFilters,
    // checkout
    checkoutStep,
  }
}