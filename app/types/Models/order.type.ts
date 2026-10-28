// ── Payload — reflète exactement CheckoutRequest::rules() côté Laravel

export interface OrderAddress {
  firstName: string
  lastName: string
  addressLine1: string
  city: string
  postalCode: string
  countryCode: string
}
 
// ── Checkout — payload envoyé, résultat renvoyé
 
export interface CheckoutPayload {
  email: string
  firstName: string
  lastName: string
  phone: string
  shippingAddress: OrderAddress
  items: Array<{
    productVariantId: string
    quantity: number
  }>
  shippingMethodId: string
  paymentMethod: string
  discountCode?: string
  source?: 'web' | 'mobile' | 'instagram' | 'whatsapp'
  notes?: string
}
 
export interface CheckoutResult {
  id: string
  orderNumber: string
  status: string
  total: number
}
 
// ── Ligne de commande
 
export interface OrderItem {
  id: string
  productName: string
  variantName: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  taxRate?: number
}
 
// ── Historique de statut
 
export interface OrderStatusHistory {
  status: string
  note: string | null
  createdAt: string
}
 
// ── Commande — vue liste (admin)
 
export interface OrderListItem {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: 'paypal' | 'bank_transfer' | 'cash'
  total: number
  createdAt: string
}
 
// ── Commande — vue détail (admin + confirmation + tracking)
 
export interface OrderDetail {
  id: string
  orderNumber: string
  createdAt: string
 
  customerName: string
  customerEmail: string
 
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: 'paypal' | 'bank_transfer' | 'cash'
  // null tant que markAsPaid() n'a pas été appelé (virement/cash) — toujours
  // rempli immédiatement pour paypal via webhook.
  paidAt?: string | null
 
  subtotal: number
  shippingAmount: number
  discountAmount: number
  taxAmount?: number
  storeCreditUsed?: number
  total: number
 
  shippingAddress: OrderAddress | null
  billingAddress: OrderAddress | null
 
  shippingMethodId?: string | null
  shippingMethodName: string | null
 
  // Renseignés uniquement une fois expédiée (OrderManagementService::ship())
  trackingNumber?: string | null
  carrierCode?: string | null
 
  // Renseigné une fois la facture générée (InvoiceService::generateForOrder(),
  // déclenché par confirm() pour paypal ou markAsPaid() pour virement/cash)
  invoiceId?: string | null
 
  items: OrderItem[]
  statusHistories: OrderStatusHistory[]
}

export interface PaymentMethodOption {
  method: 'paypal' | 'bank_transfer' | 'cash'
  label: string
  iban?: string | null
  bic?: string | null
  accountHolder?: string | null
  bankName?: string | null
  pickupAddress?: string | null
  pickupHours?: string | null
  pickupInstructions?: string | null
}

export interface LastOrderPaymentDetails {
  method: string
  iban?: string | null
  bic?: string | null
  accountHolder?: string | null
  bankName?: string | null
  pickupAddress?: string | null
  pickupHours?: string | null
}

export interface LastOrder {
  orderNumber: string
  total: number
  paymentMethod: string
  shippingMethod?: {
    minDays?: number | null
    maxDays?: number | null
  } | null
  paymentDetails?: LastOrderPaymentDetails | null
}