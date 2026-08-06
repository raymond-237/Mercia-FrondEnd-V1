export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed'
export type ReturnResolution = 'refund' | 'exchange' | 'store_credit'

export interface ReturnItem {
  id: string
  orderItemId: string
  quantity: number
  condition: string | null
  resolution: ReturnResolution
  productName?: string
  variantName?: string
}

export interface ReturnRequestListItem {
  id: string
  status: ReturnStatus
  reason: string
  notes: string | null
  createdAt: string
  order: {
    id: string
    orderNumber: string
    total: number
  } | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  itemsCount: number
}

export interface ReturnRequestDetail extends ReturnRequestListItem {
  items: ReturnItem[]
}