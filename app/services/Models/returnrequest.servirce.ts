import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize } from '~/@cores/jsonabuilder'
import type { ReturnRequestListItem, ReturnRequestDetail } from '~/types/Models/returnRequest.type'

/**
 * JSON:API sérialise les décimaux en string ("634.90", pas 634.90) —
 * même comportement que pour les commandes (voir ordersAdmin.services.ts).
 * order.total est imbriqué dans la relation `order`, donc pas couvert par
 * un simple mapAmounts() au niveau racine — mapping dédié ici.
 */
function mapReturnAmounts<T extends { order?: { total: any } | null }>(raw: T): T {
  if (!raw?.order || raw.order.total == null) return raw
  return {
    ...raw,
    order: { ...raw.order, total: Number(raw.order.total) },
  }
}

export default function useReturnRequestsService() {

  const list = async (params?: { status?: string; page?: number }) => {
    const response: AxiosResponse = await request('return-requests', {
      method: 'get',
      params: {
        'filter[status]': params?.status || undefined,
        'page[number]': params?.page || 1,
        include: 'items,order,user',
      },
    })

    const raw = JsonaDeserialize<ReturnRequestListItem[]>(response.data) ?? []

    return {
      data: raw.map(mapReturnAmounts),
      meta: response.data?.meta,
    }
  }

  const show = async (id: string) => {
    const response: AxiosResponse = await request(`return-requests/${id}`, {
      method: 'get',
      params: { include: 'items,order,user' },
    })

    const raw = JsonaDeserialize<ReturnRequestDetail>(response.data)
    return raw ? mapReturnAmounts(raw) : raw
  }

  const approve = async (id: string, restoreStock: boolean) => {
    const response: AxiosResponse = await request(`return-requests/${id}/approve`, {
      method: 'post',
      data: { restore_stock: restoreStock },
    })
    const raw = JsonaDeserialize<ReturnRequestDetail>(response.data)
    return raw ? mapReturnAmounts(raw) : raw
  }

  const reject = async (id: string, reason?: string) => {
    const response: AxiosResponse = await request(`return-requests/${id}/reject`, {
      method: 'post',
      data: { reason },
    })
    const raw = JsonaDeserialize<ReturnRequestDetail>(response.data)
    return raw ? mapReturnAmounts(raw) : raw
  }

  const complete = async (id: string) => {
    const response: AxiosResponse = await request(`return-requests/${id}/complete`, {
      method: 'post',
    })
    const raw = JsonaDeserialize<ReturnRequestDetail>(response.data)
    return raw ? mapReturnAmounts(raw) : raw
  }

  return { list, show, approve, reject, complete }
}