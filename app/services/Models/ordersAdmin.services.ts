import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize } from '~/@cores/jsonabuilder'
import type { OrderDetail, OrderListItem } from '~/types/Models/order.type'

interface OrderListQuery {
  page?: number
  status?: string
  search?: string
  sort?: string
}

interface OrderListResult {
  data: OrderListItem[]
  meta: Record<string, any>
}

const NUMERIC_FIELDS = [
  'total', 'subtotal', 'shippingAmount', 'discountAmount',
  'taxAmount', 'storeCreditUsed', 'unitPrice', 'totalPrice', 'taxRate',
]

/**
 * JSON:API sérialise tous les décimaux en string ("59.00", pas 59) —
 * comportement standard Laravel/PostgreSQL avec des colonnes decimal.
 */
function mapAmounts<T extends Record<string, any>>(obj: T): T {
  const mapped: Record<string, any> = { ...obj }
  for (const field of NUMERIC_FIELDS) {
    if (mapped[field] != null) mapped[field] = Number(mapped[field])
  }
  return mapped as T
}

/**
 * shippingAddress/billingAddress sont stockées en JSON brut côté
 * backend, donc encore en snake_case (first_name, address_line1...)
 * même après désérialisation JSON:API — contrairement aux vrais
 * attributs de colonnes qui sont déjà convertis en camelCase.
 */
function mapAddress(raw: any) {
  if (!raw) return null
  return {
    firstName:    raw.first_name ?? raw.firstName ?? '',
    lastName:     raw.last_name ?? raw.lastName ?? '',
    addressLine1: raw.address_line1 ?? raw.addressLine1 ?? '',
    city:         raw.city ?? '',
    postalCode:   raw.postal_code ?? raw.postalCode ?? '',
    countryCode:  raw.country_code ?? raw.countryCode ?? '',
  }
}

function fullName(user: any): string {
  if (!user) return ''
  return [user.firstname, user.lastname].filter(Boolean).join(' ').trim()
}

/**
 * Construit un OrderListItem complet — nécessite que la requête ait
 * inclus la relation `user` pour que customerName/customerEmail
 * soient réellement peuplés plutôt que vides.
 */
function mapOrderListItem(raw: any): OrderListItem {
  const mapped = mapAmounts(raw)
  return {
    ...mapped,
    customerName:  fullName(raw.user) || mapped.customerName || '—',
    customerEmail: raw.user?.email ?? mapped.customerEmail ?? '',
  }
}

/**
 * Construit un OrderDetail complet — nécessite que la requête ait
 * inclus items, statusHistories, user, shippingMethod, invoice.
 */
function mapOrderDetail(raw: any): OrderDetail {
  const mapped = mapAmounts(raw)

  return {
    ...mapped,
    customerName:  fullName(raw.user) || '—',
    customerEmail: raw.user?.email ?? '',
    shippingAddress: mapAddress(raw.shippingAddress),
    billingAddress:  mapAddress(raw.billingAddress),
    shippingMethodName: raw.shippingMethod?.name ?? null,
    isPickup: raw.shippingMethod?.methodType === 'pickup',

    invoiceId: raw.invoice?.id ?? null,
    transaction: raw.latestTransaction
      ? {
          provider:            raw.latestTransaction.provider,
          providerTransactionId: raw.latestTransaction.providerTransactionId ?? null,
          amount:              Number(raw.latestTransaction.amount ?? 0),
          currency:            raw.latestTransaction.currency ?? null,
          status:              raw.latestTransaction.status,
          createdAt:           raw.latestTransaction.createdAt,
        }
      : null,
    items: Array.isArray(raw.items) ? raw.items.map(mapAmounts) : [],
    statusHistories: Array.isArray(raw.statusHistories)
      ? raw.statusHistories.map((h: any) => ({
          status:    h.status,
          note:      h.note ?? null,
          createdAt: h.createdAt,
        }))
      : [],
  }
}

export default function useOrdersAdminService() {

  /**
   * GET /api/v1/orders
   */
  const list = async (query: OrderListQuery = {}): Promise<OrderListResult> => {
    const response: AxiosResponse = await request('orders', {
      method: 'get',
      params: {
        'page[number]': query.page,
        'filter[status]': query.status,
        'filter[search]': query.search,
        sort: query.sort,
        include: 'items,user',
      },
    })

    const raw = JsonaDeserialize<any[]>(response.data) ?? []

    return {
      data: raw.map(mapOrderListItem),
      meta: response.data?.meta ?? {},
    }
  }

  /**
   * GET /api/v1/orders/{order}
   */
  const show = async (id: string): Promise<OrderDetail> => {
    const response: AxiosResponse = await request(`orders/${id}`, {
      method: 'get',
      params: { include: 'items,statusHistories,user,shippingMethod,transaction,invoice' },
    })

    const raw = JsonaDeserialize<any>(response.data)
    return mapOrderDetail(raw)
  }

  /**
   * POST /api/v1/orders/{order}/confirm
   */
  const confirm = async (id: string) => {
    const response: AxiosResponse = await request(`orders/${id}/confirm`, { method: 'post' })
    return JsonaDeserialize(response.data)
  }

  /**
   * POST /api/v1/orders/{order}/ship
   * FormRequest custom (JSON plat) — carrier_code + tracking_number requis.
   */
  const ship = async (id: string, carrierCode: string | null, trackingNumber: string | null) => {
    const response: AxiosResponse = await request(`orders/${id}/ship`, {
      method: 'post',
      data: { carrier_code: carrierCode, tracking_number: trackingNumber },
    })
    return JsonaDeserialize(response.data)
  }

  /**
   * POST /api/v1/orders/{order}/deliver
   */
  const deliver = async (id: string) => {
    const response: AxiosResponse = await request(`orders/${id}/deliver`, { method: 'post' })
    return JsonaDeserialize(response.data)
  }

  /**
   * POST /api/v1/orders/{order}/mark-as-paid
   * Réservé aux paiements manuels (virement, espèces) — note obligatoire.
   */
  const markAsPaid = async (id: string, note: string) => {
    const response: AxiosResponse = await request(`orders/${id}/mark-as-paid`, {
      method: 'post',
      data: { note },
    })
    return JsonaDeserialize(response.data)
  }

  /**
   * POST /api/v1/orders/{order}/cancel
   */
  const cancel = async (id: string, reason?: string) => {
    const response: AxiosResponse = await request(`orders/${id}/cancel`, {
      method: 'post',
      data: { reason },
    })
    return JsonaDeserialize(response.data)
  }

  return {
    list,
    show,
    confirm,
    ship,
    deliver,
    markAsPaid,
    cancel,
  }
}