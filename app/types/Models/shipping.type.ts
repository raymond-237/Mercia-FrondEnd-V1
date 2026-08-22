export interface ShippingZoneFormData {
  name: string
  countries: string[]
}

export interface ShippingZoneListItem {
  id: string
  name: string
  countries: string[]
  methodsCount?: number
}

export interface ShippingMethodFormData {
  name: string
  carrierCode: string
  trackingUrl: string
  minDays: number | null
  maxDays: number | null
  price: number
  freeAbove: number | null
  isActive: boolean
  allowedPaymentMethods: string[]
  zone: string // id de la zone
}

export interface ShippingMethodListItem {
  id: string
  name: string
  carrierCode?: string
  minDays: number
  maxDays: number
  price: number
  freeAbove?: number
  isActive: boolean
  zone?: { id: string; name: string }
}