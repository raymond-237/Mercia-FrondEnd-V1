import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize } from '~/@cores/jsonabuilder'
import type { ReturnRequestListItem, ReturnRequestDetail } from '~/types/Models/returnRequest.type'

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
    return {
      data: JsonaDeserialize<ReturnRequestListItem[]>(response.data),
      meta: response.data?.meta,
    }
  }

  const show = async (id: string) => {
    const response: AxiosResponse = await request(`return-requests/${id}`, {
      method: 'get',
      params: { include: 'items,order,user' },
    })
    return JsonaDeserialize<ReturnRequestDetail>(response.data)
  }

  const approve = async (id: string, restoreStock: boolean) => {
    const response: AxiosResponse = await request(`return-requests/${id}/approve`, {
      method: 'post',
      data: { restore_stock: restoreStock },
    })
    return JsonaDeserialize<ReturnRequestDetail>(response.data)
  }

  const reject = async (id: string, reason?: string) => {
    const response: AxiosResponse = await request(`return-requests/${id}/reject`, {
      method: 'post',
      data: { reason },
    })
    return JsonaDeserialize<ReturnRequestDetail>(response.data)
  }

  const complete = async (id: string) => {
    const response: AxiosResponse = await request(`return-requests/${id}/complete`, {
      method: 'post',
    })
    return JsonaDeserialize<ReturnRequestDetail>(response.data)
  }

  return { list, show, approve, reject, complete }
}