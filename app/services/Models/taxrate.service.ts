import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize, JsonaSerialize } from '~/@cores/jsonabuilder'
import { TAX_RATES } from '~/@cores/constantes/apiresource'
import type { TaxRateListItem, TaxRateFormData } from '~/types/Models/taxRate.type'

export default function useTaxRatesService() {

  const list = async () => {
    const response: AxiosResponse = await request('tax-rates', { method: 'get' })
    return JsonaDeserialize<TaxRateListItem[]>(response.data)
  }

  const show = async (id: string) => {
    const response: AxiosResponse = await request(`tax-rates/${id}`)
    return JsonaDeserialize<TaxRateListItem>(response.data)
  }

  const create = async (payload: TaxRateFormData) => {
    const data = JsonaSerialize(TAX_RATES, payload) as any
    const response: AxiosResponse = await request('tax-rates', { method: 'post', data })
    return JsonaDeserialize<TaxRateListItem>(response.data)
  }

  const update = async (id: string, payload: TaxRateFormData) => {
    const data = JsonaSerialize(TAX_RATES, payload) as any
    data.data.id = id
    const response: AxiosResponse = await request(`tax-rates/${id}`, { method: 'patch', data })
    return JsonaDeserialize<TaxRateListItem>(response.data)
  }

  const remove = async (id: string) => {
    await request(`tax-rates/${id}`, { method: 'delete' })
  }

  return { list, show, create, update, remove }
}