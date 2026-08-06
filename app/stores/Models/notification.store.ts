import { defineStore } from 'pinia'
import useNotificationsService from '~/services/Models/notifications.service'
import type { NotificationItem } from '~/types/Models/notification.type'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [] as NotificationItem[],
    unreadCount: 0,
    loading: false,
    currentPage: 1,
    lastPage: 1,
    hasLoadedOnce: false,
  }),

  actions: {
    /**
     * Charge la première page — appelé au montage de la topbar et à
     * chaque ouverture du menu notifications (pas de polling pour
     * l'instant, WebSockets prévus plus tard).
     */
    async fetchNotifications(): Promise<void> {
      this.loading = true
      try {
        const service = useNotificationsService()
        const { data, unreadCount, lastPage } = await service.list(1)
        this.items         = data
        this.unreadCount    = unreadCount
        this.currentPage    = 1
        this.lastPage        = lastPage
        this.hasLoadedOnce   = true
      } catch (e) {
        console.error('[notifications] fetchNotifications failed:', e)
      } finally {
        this.loading = false
      }
    },

    /**
     * Charge la page suivante et l'ajoute à la suite (scroll infini
     * dans le dropdown).
     */
    async loadMore(): Promise<void> {
      if (this.currentPage >= this.lastPage || this.loading) return
      this.loading = true
      try {
        const service = useNotificationsService()
        const { data, lastPage } = await service.list(this.currentPage + 1)
        this.items       = [...this.items, ...data]
        this.currentPage += 1
        this.lastPage      = lastPage
      } catch (e) {
        console.error('[notifications] loadMore failed:', e)
      } finally {
        this.loading = false
      }
    },

    /**
     * Rafraîchit juste le compteur — léger, utilisable sans recharger
     * toute la liste (ex: au changement de route).
     */
    async refreshUnreadCount(): Promise<void> {
      try {
        const service = useNotificationsService()
        this.unreadCount = await service.unreadCount()
      } catch (e) {
        console.error('[notifications] refreshUnreadCount failed:', e)
      }
    },

    async markAsRead(id: string): Promise<void> {
      const item = this.items.find(n => n.id === id)
      if (!item || item.readAt) return

      item.readAt = new Date().toISOString()
      this.unreadCount = Math.max(0, this.unreadCount - 1)

      try {
        const service = useNotificationsService()
        await service.markRead(id)
      } catch (e) {
        console.error('[notifications] markAsRead failed:', e)
      }
    },

    async markAllAsRead(): Promise<void> {
      const previouslyUnread = this.items.filter(n => !n.readAt).map(n => n.id)
      this.items.forEach(n => { if (!n.readAt) n.readAt = new Date().toISOString() })
      this.unreadCount = 0

      try {
        const service = useNotificationsService()
        await service.markAllRead()
      } catch (e) {
        console.error('[notifications] markAllAsRead failed:', e)
        previouslyUnread.forEach(id => {
          const item = this.items.find(n => n.id === id)
          if (item) item.readAt = null
        })
      }
    },

    /**
     * Point d'entrée pour un futur listener WebSocket/Pusher —
     * appeler cette méthode depuis le handler `.listen('NotificationSent', ...)`
     * d'Echo une fois branché, pour insérer une notif en temps réel
     * sans recharger toute la liste.
     */
    receivePush(notification: NotificationItem) {
      this.items.unshift(notification)
      if (!notification.readAt) this.unreadCount += 1
    },
  },
})