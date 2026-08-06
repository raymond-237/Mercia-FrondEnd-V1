import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize, JsonaSerialize } from '~/@cores/jsonabuilder'
import { DISCOUNT_CODES } from '~/@cores/constantes/apiresource'
import type { DiscountCodeListItem, DiscountCodeFormData } from '~/types/Models/discountCode.type'

export default function useDiscountCodesService() {

  const list = async (params?: { search?: string; status?: string; page?: number }) => {
    const response: AxiosResponse = await request('discount-codes', {
      method: 'get',
      params: {
        'filter[search]': params?.search || undefined,
        'filter[isActive]': params?.status === 'active' ? true : params?.status === 'inactive' ? false : undefined,
        'page[number]': params?.page || 1,
        sort: '-createdAt',
      },
    })
    return {
      data: JsonaDeserialize<DiscountCodeListItem[]>(response.data),
      meta: response.data?.meta,
    }
  }

  const show = async (id: string) => {
    const response: AxiosResponse = await request(`discount-codes/${id}`)
    return JsonaDeserialize<DiscountCodeListItem>(response.data)
  }

  const create = async (payload: DiscountCodeFormData) => {
    const data = JsonaSerialize(DISCOUNT_CODES, payload) as any
    const response: AxiosResponse = await request('discount-codes', { method: 'post', data })
    return JsonaDeserialize<DiscountCodeListItem>(response.data)
  }

  const update = async (id: string, payload: DiscountCodeFormData) => {
    const data = JsonaSerialize(DISCOUNT_CODES, payload) as any
    data.data.id = id
    const response: AxiosResponse = await request(`discount-codes/${id}`, { method: 'patch', data })
    return JsonaDeserialize<DiscountCodeListItem>(response.data)
  }

  const remove = async (id: string) => {
    await request(`discount-codes/${id}`, { method: 'delete' })
  }

  const generateCode = async (): Promise<string> => {
    const response: AxiosResponse = await request('discount-codes/generate-code', { method: 'post' })
    return response.data?.data?.code ?? ''
  }

  const toggleActive = async (id: string) => {
    const response: AxiosResponse = await request(`discount-codes/${id}/toggle-active`, { method: 'patch' })
    return JsonaDeserialize<DiscountCodeListItem>(response.data)
  }

const validate = async (code: string, items: { product_variant_id: string; quantity: number }[]) => {
    const response: AxiosResponse = await request('storefront/discount-codes/validate', {
      method: 'post',
      data: { code, items },
    })
    return response.data.data as { code: string; discountAmount: number }
  }
  return {
    list,
    show, 
    create,
    update,
    remove,
    generateCode,
    toggleActive,
    validate
  }
}