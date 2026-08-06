import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'

export interface AnalyticsSummary {
  ordersCount: number
  unitsSold: number
  revenue: number
  cost: number
  profit: number
  marginPercent: number
}

export interface CategoryProfit {
  categoryId: string
  categoryName: string
  parentId: string | null
  parentName: string | null
  unitsSold: number
  revenue: number
  cost: number
  profit: number
  marginPercent: number
}

export interface PaymentMethodAmount {
  method: string
  ordersCount: number
  amount: number
}

export default function useAnalyticsService() {

  /**
   * GET /api/v1/analytics/profit-by-category
   * Réponse plate custom (pas JSON:API) — c'est de l'agrégation SQL, pas une
   * ressource CRUD, pas de JsonaDeserialize ici.
   */
  const profitByCategory = async (from: string, to: string) => {
    const response: AxiosResponse = await request('analytics/profit-by-category', {
      method: 'get',
      params: { from, to },
    })

    return response.data.data as {
      summary: AnalyticsSummary
      categories: CategoryProfit[]
    }
  }

  /**
   * GET /api/v1/analytics/payment-breakdown
   * received = argent réellement arrivé (statut confirmed+).
   * pending = commandes encore pending pour ce moyen de paiement — pas
   * encore reçu, à surveiller si ça traîne (surtout virement).
   */
  const paymentBreakdown = async (from: string, to: string) => {
    const response: AxiosResponse = await request('analytics/payment-breakdown', {
      method: 'get',
      params: { from, to },
    })

    return response.data.data as {
      received: PaymentMethodAmount[]
      pending: PaymentMethodAmount[]
    }
  }

  return { profitByCategory, paymentBreakdown }
}