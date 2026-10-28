import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize } from '~/@cores/jsonabuilder'
import type { InventoryListItem, InventoryDetail } from '~/types/Models/inventory.type'

function mergeProductNames(items: InventoryListItem[], raw: any): InventoryListItem[] {
  const included: any[] = raw?.included ?? []

  const variants = new Map(included.filter(i => i.type === 'product-variants').map(i => [i.id, i]))
  const products = new Map(included.filter(i => i.type === 'products').map(i => [i.id, i]))
  const rawById  = new Map((raw?.data ?? []).map((i: any) => [i.id, i]))

  return items.map(item => {
    const rawItem: any = rawById.get(item.id)
    const variant: any = variants.get(rawItem?.relationships?.productVariant?.data?.id)
    const product: any = products.get(variant)

    return { ...item, productName:product?.name ?? null }
  })
}
export default function useInventoryService() {
  

  const list = async (params?: { search?: string; page?: number }) => {
    const response: AxiosResponse = await request('inventories', {
      method: 'get',
      params: {
        'filter[search]': params?.search || undefined,
        'page[number]': params?.page || 1,
        include: 'productVariant,productVariant.product',
      },
    })
    const items = JsonaDeserialize<InventoryListItem[]>(response.data)

    return {
      data: mergeProductNames(items, response.data),
      meta: response.data?.meta,
    }
  }

  const show = async (id: string) => {
    const response: AxiosResponse = await request(`inventories/${id}`, {
      method: 'get',
      params: { include: 'productVariant,movements,productVariant.product' },
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