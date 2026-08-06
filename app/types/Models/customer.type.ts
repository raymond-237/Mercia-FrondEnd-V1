export interface CustomerListItem {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  status: string
  ordersCount: number
  totalSpent: number
  lastOrderAt: string | null
  createdAt: string
}

export interface CustomerOrderSummary {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
}

export interface CustomerDetail extends CustomerListItem {
  recentOrders: CustomerOrderSummary[]
}