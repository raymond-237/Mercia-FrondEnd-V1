export interface Carrier {
  code: string
  name: string
  /** {trackingNumber} sera remplacé par le numéro réel */
  trackingUrlPattern: string
}

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