import { buildTrackingUrl } from '~/@cores/constantes/carriers'

export interface TrackingResult {
  orderNumber: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered'
  orderDate: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  isDelivered: boolean

  shippingMethodName: string | null

  isPickup: boolean
  pickupAddress: string | null
  pickupHours: string | null
  pickupInstructions: string | null
  pickupPhone: string | null

  estimatedDeliveryMin: number | null
  estimatedDeliveryMax: number | null
  statusDates: Record<string, string> | null
}

