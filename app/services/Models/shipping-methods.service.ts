import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize, JsonaSerialize } from '~/@cores/jsonabuilder'
import { SHIPPING_METHODS, SHIPPING_ZONES } from '~/@cores/constantes/apiresource'
import type { ShippingMethodData } from '~/types/public/index.type'
import type { ShippingMethodFormData, ShippingMethodListItem } from '~/types/Models/shipping.type'

/**
 * zone est une relationship (BelongsTo::make('zone', 'shippingZone')),
 * pas un attribut — construite à la main, même pattern que category
 * sur Produits.
 */
function buildMethodDocument(payload: ShippingMethodFormData, id?: string) {
  const { zone, ...rest } = payload

  const toNullableNumber = (v: unknown): number | null => {
    if (v === '' || v === undefined || v === null) return null
    const n = Number(v)
    return Number.isNaN(n) ? null : n
  }

  const attributes = {
    ...rest,
    minDays:   toNullableNumber(rest.minDays),
    maxDays:   toNullableNumber(rest.maxDays),
    price:     toNullableNumber(rest.price) ?? 0,
    freeAbove: toNullableNumber(rest.freeAbove),
  }

  const base = JsonaSerialize(SHIPPING_METHODS, attributes) as any
  if (id) base.data.id = id

  if (zone) {
    base.data.relationships = {
      zone: { data: { type: SHIPPING_ZONES, id: zone } },
    }
  }

  return base
}

export default function useShippingMethodsService() {

  /**
   * GET /api/v1/shipping-methods/available
   * Endpoint public — checkout storefront. Inchangé.
   */
  const available = async (params: { country?: string; subtotal?: number } = {}): Promise<ShippingMethodData[]> => {
    const response: AxiosResponse = await request('shipping-methods/available', {
      method: 'get',
      params,
    })
    return JsonaDeserialize<ShippingMethodData[]>(response.data)
  }

  /**
   * GET /api/v1/shipping-methods — vue admin (toutes les méthodes, actives ou non)
   */
  const list = async (): Promise<ShippingMethodListItem[]> => {
    const response: AxiosResponse = await request('shipping-methods', {
      params: { include: 'zone' },
    })
    return JsonaDeserialize<ShippingMethodListItem[]>(response.data)
  }

  const create = async (payload: ShippingMethodFormData) => {
    const data = buildMethodDocument(payload)
    const response: AxiosResponse = await request('shipping-methods', { method: 'post', data })
    return JsonaDeserialize(response.data)
  }

  const update = async (id: string, payload: ShippingMethodFormData) => {
    const data = buildMethodDocument(payload, id)
    const response: AxiosResponse = await request(`shipping-methods/${id}`, { method: 'patch', data })
    return JsonaDeserialize(response.data)
  }

  const remove = async (id: string): Promise<void> => {
    await request(`shipping-methods/${id}`, { method: 'delete' })
  }

  return {
    available,
    list,
    create,
    update,
    remove,
  }
}