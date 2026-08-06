import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import type { NotificationItem } from '~/types/Models/notification.type'

export default function useNotificationsService() {

  const list = async (page = 1) => {
    const response: AxiosResponse = await request('notifications', {
      method: 'get',
      params: { 'page[number]': page },
    })
    return {
      data: (response.data?.data ?? []) as NotificationItem[],
      unreadCount: response.data?.meta?.unreadCount ?? 0,
      lastPage: response.data?.meta?.page?.lastPage ?? 1,
    }
  }

  const unreadCount = async (): Promise<number> => {
    const response: AxiosResponse = await request('notifications/unread-count', { method: 'get' })
    return response.data?.data?.unreadCount ?? 0
  }

  const markRead = async (id: string) => {
    await request(`notifications/${id}/read`, { method: 'post' })
  }

  const markAllRead = async () => {
    await request('notifications/read-all', { method: 'post' })
  }

  return { list, unreadCount, markRead, markAllRead }
}