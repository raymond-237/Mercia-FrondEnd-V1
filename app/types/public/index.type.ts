// ── Produit -

export interface ProductCardData {
  id:               string
  slug:             string
  name:             string
  variantName:      string
  price:            number
  comparePrice:     number | null
  imageUrl:         string
  images:           string[]   // toutes les images du produit, pour le carousel des cards
  rating:           number | null
  isNew:            boolean
  isBestSeller:     boolean
  isCare:           boolean
  stockQuantity:    number
  lowStockThreshold: number
  shippingEstimate: string
  defaultVariantId: string
  minQuantity:      number
  maxQuantity:      number | null
}

export interface ProductVariantOption {
  id:    string
  label: string
  value: string
  inStock: boolean
}

export interface ProductOptionType {
  id:      string
  name:    string
  values:  ProductVariantOption[]
}

// ── Catégorie 

export interface CategoryData {
  id:           string
  name:         string
  slug:         string
  productCount: number
  imageUrl:     string | null
}

// ── Avis -─

export interface ReviewData {
  id:             string
  authorName:     string
  authorCity:     string
  authorAvatarUrl: string | null
  rating:         number
  text:           string
  productName:    string
  productSlug:    string
}

// ── Panier -

export interface CartItemLocal {
  variantId:   string
  productId:   string
  productName: string
  variantName: string
  price:       number
  quantity:    number
  imageUrl:    string | null
  minQuantity: number
  maxQuantity: number | null
}

export interface PromoResult {
  code:           string
  discountAmount: number
  type:           'percentage' | 'fixed'
}

// ── Filtres 

export interface FilterState {
  length:  string[]
  texture: string[]
  color:   string[]
}

// ── Livraison 

export interface ShippingMethodData {
  id:       string
  name:     string
  price:    number
  minDays:  number
  maxDays:  number
  isFree:   boolean
}

// ── Proof bar 

export interface ProofStat {
  icon:  string
  value: string
  label: string
}

// ── Checkout 

export interface CheckoutInfoForm {
  firstName: string
  lastName:  string
  email:     string
  phone:     string
}

export interface CheckoutAddressForm {
  addressLine1: string
  city:         string
  postalCode:   string
  country:      string
}

export interface CheckoutForm extends CheckoutInfoForm, CheckoutAddressForm {
  shippingMethodId: string | null
}

// ── Confirmation commande 

export interface OrderConfirmationData {
  orderNumber:      string
  total:            number
  shippingEstimate: string
  email:            string
}

// ── Retour -

export type ReturnResolution = 'refund' | 'exchange' | 'store_credit'

export interface ReturnItemForm {
  orderItemId: string
  quantity:    number
  condition:   string | null
  resolution:  ReturnResolution
}