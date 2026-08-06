import type { AxiosResponse } from 'axios'
import { SHIPPING_ZONES } from '~/@cores/constantes/apiresource'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize, JsonaSerialize } from '~/@cores/jsonabuilder'
import type { ShippingZoneFormData, ShippingZoneListItem } from '~/types/Models/shipping.type'

/**
 * canCount() (si activé côté ShippingZoneSchema) expose le total via
 * relationships.methods.meta.count dans le document JSON:API brut —
 * JsonaDeserialize ne le remonte JAMAIS automatiquement en attribut plat
 * methodsCount, il faut l'extraire du document brut et le fusionner par id
 * après désérialisation. Même principe que productsCount sur Supplier.
 *
 * Hypothèse non vérifiée : le nom de la relation est 'methods' — à
 * confirmer contre le vrai nom dans ShippingZoneSchema.php.
 */
function mergeMethodsCount(zones: ShippingZoneListItem[], rawResponse: any): ShippingZoneListItem[] {
  const rawList = Array.isArray(rawResponse?.data) ? rawResponse.data : [rawResponse?.data].filter(Boolean)

  const countsById = new Map<string, number>()
  for (const raw of rawList) {
    const count = raw?.relationships?.methods?.meta?.count
    if (count != null) countsById.set(raw.id, count)
  }

  return zones.map(z => ({
    ...z,
    methodsCount: countsById.get(z.id) ?? (z as any).methodsCount ?? 0,
  }))
}

export default function useShippingZonesService() {

  /**
   * ?withCount=methods — sans lui, même si canCount() est activé côté
   * Schema, le backend ne calcule/renvoie pas le compteur.
   */
  const list = async (): Promise<ShippingZoneListItem[]> => {
    const response: AxiosResponse = await request('shipping-zones', {
      params: { withCount: 'methods' },
    })
    const zones = JsonaDeserialize<ShippingZoneListItem[]>(response.data)
    return mergeMethodsCount(zones, response.data)
  }

  const create = async (payload: ShippingZoneFormData) => {
    const data = JsonaSerialize(SHIPPING_ZONES, payload)
    const response: AxiosResponse = await request('shipping-zones', { method: 'post', data })
    return JsonaDeserialize(response.data)
  }

  const update = async (id: string, payload: ShippingZoneFormData) => {
    const data = JsonaSerialize(SHIPPING_ZONES, payload) as any
    data.data.id = id
    const response: AxiosResponse = await request(`shipping-zones/${id}`, { method: 'patch', data })
    return JsonaDeserialize(response.data)
  }

  const remove = async (id: string): Promise<void> => {
    await request(`shipping-zones/${id}`, { method: 'delete' })
  }

  return { list, create, update, remove }
}