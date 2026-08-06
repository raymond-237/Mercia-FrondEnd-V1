export interface AddressSuggestion {
  label: string
  addressLine1: string
  city: string
  postalCode: string
  countryCode: string
}

/**
 * Photon (Komoot) — API de géocodage gratuite basée sur
 * OpenStreetMap, sans clé. Encapsulée ici comme n'importe quel autre
 * service de l'app : jamais d'appel réseau direct dans un composant.
 */
function mapFeatureToSuggestion(feature: any): AddressSuggestion {
  const props = feature.properties ?? {}
  const streetLine = [props.housenumber, props.street].filter(Boolean).join(' ') || props.name || ''

  return {
    label:        [props.housenumber, props.street, props.city].filter(Boolean).join(', ') || props.name || '',
    addressLine1: streetLine,
    city:         props.city ?? props.locality ?? '',
    postalCode:   props.postcode ?? '',
    countryCode:  (props.countrycode ?? '').toUpperCase(),
  }
}

export default function useAddressService() {

  /**
   * Recherche d'adresses en direct pendant la frappe. Ne lance jamais
   * d'exception vers l'appelant — en cas de panne du service externe,
   * retourne un tableau vide pour dégrader proprement vers la saisie
   * manuelle plutôt que de casser le formulaire de checkout.
   */
  const search = async (query: string): Promise<AddressSuggestion[]> => {
    if (query.trim().length < 4) return []

    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=fr`
      )
      if (!response.ok) throw new Error('Photon unavailable')

      const json = await response.json()
      const features: any[] = json.features ?? []

      return features.map(mapFeatureToSuggestion)
    } catch (e) {
      console.error('Erreur service adresse (dégradation en saisie manuelle):', e)
      return []
    }
  }

  return { search }
}