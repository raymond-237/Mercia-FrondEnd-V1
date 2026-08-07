import type { TrackingResult } from "~/types/Models/Ordertracking";

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