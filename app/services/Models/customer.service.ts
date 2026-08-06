import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize } from '~/@cores/jsonabuilder'
import type { CustomerListItem, CustomerDetail } from '~/types/Models/customer.type'

/**
 * JSON:API sérialise tous les décimaux en string — comportement
 * standard Laravel/PostgreSQL avec des colonnes decimal.
 */
function mapCustomerDetail(raw: any): CustomerDetail {
  const orders: any[] = Array.isArray(raw.orders) ? raw.orders : []

  return {
    ...raw,
    totalSpent:  Number(raw.totalSpent ?? 0),
    ordersCount: Number(raw.ordersCount ?? orders.length ?? 0),
    recentOrders: orders.map((o: any) => ({
      id:          o.id,
      orderNumber: o.orderNumber,
      status:      o.status,
      total:       Number(o.total ?? 0),
      createdAt:   o.createdAt,
    })),
  } as CustomerDetail
}

export default function useCustomersService() {

  const list = async (params?: { search?: string; page?: number }) => {
    const response: AxiosResponse = await request('customers', {
      method: 'get',
      params: {
        'filter[search]': params?.search || undefined,
        'page[number]': params?.page || 1,
      },
    })

    const raw = JsonaDeserialize<any[]>(response.data) ?? []

    return {
      data: raw.map((c: any) => ({
        ...c,
        totalSpent:  Number(c.totalSpent ?? 0),
        ordersCount: Number(c.ordersCount ?? 0),
      })) as CustomerListItem[],
      meta: response.data?.meta,
    }
  }

  const show = async (id: string): Promise<CustomerDetail | null> => {
    const response: AxiosResponse = await request(`customers/${id}`, {
      method: 'get',
      params: {
        include: 'orders',
      },
    })

    const raw = JsonaDeserialize<any>(response.data)
    if (!raw) return null

    return mapCustomerDetail(raw)
  }

  return { list, show }
}