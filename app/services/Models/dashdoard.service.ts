import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import type { DashboardSummary } from '~/types/Models/dashboard.type'

export default function useDashboardService() {

  const summary = async (period: 'monthly' | 'weekly'): Promise<DashboardSummary> => {
    const response: AxiosResponse = await request('dashboard/summary', {
      method: 'get',
      params: { period },
    })
    return response.data?.data
  }

  return { summary }
}