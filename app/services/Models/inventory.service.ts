import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize } from '~/@cores/jsonabuilder'
import type { InventoryListItem, InventoryDetail } from '~/types/Models/inventory.type'

export default function useInventoryService() {

  const list = async (params?: { search?: string; page?: number }) => {
    const response: AxiosResponse = await request('inventories', {
      method: 'get',
      params: {
        'filter[search]': params?.search || undefined,
        'page[number]': params?.page || 1,
        include: 'productVariant',
      },
    })
    return {
      data: JsonaDeserialize<InventoryListItem[]>(response.data),
      meta: response.data?.meta,
    }
  }

  const show = async (id: string) => {
    const response: AxiosResponse = await request(`inventories/${id}`, {
      method: 'get',
      params: { include: 'productVariant,movements' },
    })
    return JsonaDeserialize<InventoryDetail>(response.data)
  }

  const addStock = async (id: string, quantity: number, reason?: string) => {
    const response: AxiosResponse = await request(`inventories/${id}/add-stock`, {
      method: 'post',
      data: { quantity, reason },
    })
    return JsonaDeserialize<InventoryDetail>(response.data)
  }

  const removeStock = async (id: string, quantity: number, reason?: string) => {
    const response: AxiosResponse = await request(`inventories/${id}/remove-stock`, {
      method: 'post',
      data: { quantity, reason },
    })
    return JsonaDeserialize<InventoryDetail>(response.data)
  }

  const adjust = async (id: string, quantity: number, reason?: string) => {
    const response: AxiosResponse = await request(`inventories/${id}/adjust`, {
      method: 'post',
      data: { quantity, reason },
    })
    return JsonaDeserialize<InventoryDetail>(response.data)
  }

  return { list, show, addStock, removeStock, adjust }
}