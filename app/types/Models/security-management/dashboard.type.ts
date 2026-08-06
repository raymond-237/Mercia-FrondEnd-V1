export interface DashboardStat {
  label: string
  value: string
  icon: string
  trendLabel: string
  trendValue: string
  trendDirection: 'up' | 'down'
}

export interface SalesChartData {
  labels: string[]
  values: number[]
}

export interface CategoryBreakdownItem {
  label: string
  value: number
  color: string
}

export interface QuickCounts {
  pendingOrders: number
  pendingReturns: number
  lowStock: number
}

export interface RecentOrderItem {
  id: string
  orderNumber: string
  customer: string
  date: string
  status: string
  amount: string
}

export interface RecentActivityItem {
  icon: string
  text: string
  detail: string
  time: string
}

export interface DashboardSummary {
  stats: DashboardStat[]
  salesChart: SalesChartData
  categoryBreakdown: CategoryBreakdownItem[]
  quickCounts: QuickCounts
  recentOrders: RecentOrderItem[]
  recentActivity: RecentActivityItem[]
}