export interface NotificationItem {
  id: string
  title: string
  message: string
  url: string | null
  icon: string
  color: string
  readAt: string | null
  createdAt: string
}