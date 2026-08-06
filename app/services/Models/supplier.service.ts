import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize, JsonaSerialize } from '~/@cores/jsonabuilder'
import { SUPPLIERS } from '~/@cores/constantes/apiresource'

export interface Supplier {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  country: string | null
  notes: string | null
  isActive: boolean
  productsCount: number
  createdAt: string
}

export interface SupplierFormData {
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  country: string | null
  notes: string | null
  isActive: boolean
}

export default function useSuppliersService() {

  /**
   * GET /api/v1/suppliers
   * ?withCount=products pour peupler productsCount depuis meta.count
   * (canCount() côté Schema) — sans lui, le compteur reste à 0.
   */
  const list = async (search?: string): Promise<Supplier[]> => {
    const response: AxiosResponse = await request('suppliers', {
      method: 'get',
      params: {
        withCount: 'products',
        ...(search ? { 'filter[name]': search } : {}),
      },
    })
    return JsonaDeserialize<Supplier[]>(response.data)
  }

  /**
   * GET /api/v1/suppliers/{supplier}
   */
  const show = async (id: string): Promise<Supplier> => {
    const response: AxiosResponse = await request(`suppliers/${id}`, {
      params: { withCount: 'products' },
    })
    return JsonaDeserialize<Supplier>(response.data)
  }

  /**
   * POST /api/v1/suppliers
   * Route JSON:API standard — attributs en camelCase, pas de snake_case
   * (contrairement aux endpoints custom comme orders/checkout).
   */
  const create = async (payload: SupplierFormData): Promise<Supplier> => {
    const data = JsonaSerialize(SUPPLIERS, payload)
    const response: AxiosResponse = await request('suppliers', {
      method: 'post',
      data,
    })
    return JsonaDeserialize<Supplier>(response.data)
  }

  /**
   * PATCH /api/v1/suppliers/{id}
   */
  const update = async (id: string, payload: SupplierFormData): Promise<Supplier> => {
    const data = JsonaSerialize(SUPPLIERS, payload) as any
    data.data.id = id
    const response: AxiosResponse = await request(`suppliers/${id}`, {
      method: 'patch',
      data,
    })
    return JsonaDeserialize<Supplier>(response.data)
  }

  /**
   * DELETE /api/v1/suppliers/{id}
   */
  const remove = async (id: string): Promise<void> => {
    await request(`suppliers/${id}`, { method: 'delete' })
  }

  return {
    list,
    show,
    create,
    update,
    remove,
  }
}