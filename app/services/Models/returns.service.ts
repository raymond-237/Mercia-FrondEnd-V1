import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize, toSnakeCase } from '~/@cores/jsonabuilder'

export interface ReturnSubmitItem {
  orderItemId: string
  quantity: number
  condition?: string
  resolution: 'refund' | 'exchange' | 'store_credit'
}

export interface ReturnSubmitPayload {
  reason: string
  notes?: string
  items: ReturnSubmitItem[]
}

export default function useReturnsService() {

  /**
   * POST /api/v1/return-requests/lookup
   * FormRequest classique (ReturnLookupRequest) — JSON plat en entrée,
   * pas d'enveloppe JSON:API. La réponse mélange meta (token) + data JSON:API.
   */
  const lookup = async (orderNumber: string, email: string) => {
    const data = toSnakeCase({ orderNumber, email })

    const response: AxiosResponse = await request('return-requests/lookup', {
      method: 'post',
      data,
    })

    return {
      accessToken: response.data?.meta?.access_token as string | undefined,
      expiresIn:   response.data?.meta?.expires_in as number | undefined,
      order:       JsonaDeserialize<any>(response.data),
    }
  }

  /**
   * POST /api/v1/return-requests
   * Header requis : X-Return-Access-Token (obtenu via lookup()).
   * JSON plat en entrée — reason/items/notes en top-level.
   */
  const submit = async (payload: ReturnSubmitPayload, accessToken: string) => {
    const data = toSnakeCase(payload)

    const response: AxiosResponse = await request('return-requests', {
      method: 'post',
      data,
      headers: {
        'X-Return-Access-Token': accessToken,
      },
    })

    return JsonaDeserialize(response.data)
  }

  return {
    lookup,
    submit,
  }
}