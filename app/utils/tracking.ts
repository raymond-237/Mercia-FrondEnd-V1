import type { TrackingResult } from "~/types/Models/Ordertracking";
import type { Carrier } from "~/types/public/carriers.type";


export const CARRIERS: Carrier[] = [
  { code: 'poste_italiane', name: 'Poste Italiane (SDA)', trackingUrlPattern: 'https://www.poste.it/cerca/index.html#/risultati-spedizioni/{trackingNumber}' },
  { code: 'brt',            name: 'BRT (Bartolini)',      trackingUrlPattern: 'https://vas.brt.it/vas/sped_det_show.hsm?Nspediz={trackingNumber}' },
  { code: 'gls',            name: 'GLS',                  trackingUrlPattern: 'https://gls-group.eu/IT/it/servizi-online/ricerca-spedizioni?match={trackingNumber}' },
  { code: 'dhl',            name: 'DHL',                  trackingUrlPattern: 'https://www.dhl.com/it-it/home/tracking.html?tracking-id={trackingNumber}' },
  { code: 'ups',            name: 'UPS',                  trackingUrlPattern: 'https://www.ups.com/track?tracknum={trackingNumber}' },
  { code: 'fedex',          name: 'FedEx',                trackingUrlPattern: 'https://www.fedex.com/fedextrack/?trknbr={trackingNumber}' },
  { code: 'dpd',            name: 'DPD',                  trackingUrlPattern: 'https://tracking.dpd.de/status/it_IT/parcel/{trackingNumber}' },
  { code: 'inpost',         name: 'InPost (point relais)', trackingUrlPattern: 'https://inpost.it/tracking/{trackingNumber}' },
]
export function buildTrackingUrl(carrierCode: string, trackingNumber: string): string | null {
  const carrier = CARRIERS.find(c => c.code === carrierCode)
  if (!carrier || !trackingNumber) return null
  return carrier.trackingUrlPattern.replace('{trackingNumber}', encodeURIComponent(trackingNumber))
}
export function mapTrackingResult(data: any): TrackingResult {
  return {
    orderNumber: data.orderNumber,
    status:      data.status,
    orderDate:   data.orderDate ?? data.createdAt ?? null,

    trackingNumber: data.trackingNumber ?? null,
    // Construite ici, pas renvoyée par le backend — évite de dupliquer
    // la liste des transporteurs (carriers.ts) côté PHP.
    trackingUrl: data.carrierCode && data.trackingNumber
      ? buildTrackingUrl(data.carrierCode, data.trackingNumber)
      : null,
    isDelivered: data.status === 'delivered',

    // Nom réel de la méthode choisie par le client — saisi librement par
    // l'admin dans AdminDrawerMethod.vue, jamais hardcodé ici.
    shippingMethodName: data.shippingMethodName ?? null,

    // Ramassage en magasin — bascule tout l'affichage post-timeline.
    isPickup:           data.isPickup ?? false,
    pickupAddress:      data.pickupAddress ?? null,
    pickupHours:        data.pickupHours ?? null,
    pickupInstructions: data.pickupInstructions ?? null,
    pickupPhone:        data.pickupPhone ?? null,

    estimatedDeliveryMin: data.estimatedDeliveryMin ?? null,
    estimatedDeliveryMax: data.estimatedDeliveryMax ?? null,

    // Horodatage par étape, optionnel — si absent, seule l'étape en
    // cours affiche "En cours" et les autres restent muettes.
    statusDates: data.statusDates ?? null,
  }
}