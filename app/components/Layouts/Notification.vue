<script setup lang="ts">
import { useNotificationsStore } from '~/stores/Models/notification.store'


const router = useRouter()
const notificationsStore = useNotificationsStore()

onMounted(() => {
  notificationsStore.fetchNotifications()
})

const menuOpen = ref(false)
watch(menuOpen, (open) => {
  if (open) notificationsStore.fetchNotifications()
})

async function onNotificationClick(notif: { id: string; url: string | null; readAt: string | null }) {
  if (!notif.readAt) await notificationsStore.markAsRead(notif.id)
  menuOpen.value = false
  if (notif.url) router.push(notif.url)
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days}j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

const scrollEl = ref<HTMLElement | null>(null)
function onScroll() {
  const el = scrollEl.value
  if (!el) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
    notificationsStore.loadMore()
  }
}
</script>

<template>
  <v-menu v-model="menuOpen" location="bottom end" offset="10" :close-on-content-click="false">
    <template #activator="{ props }">
      <v-badge
        :model-value="notificationsStore.unreadCount > 0"
        :content="notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount"
        color="secondary"
        offset-x="4"
        offset-y="-4"
      >
        <v-btn icon variant="tonal" color="secondary" size="42" v-bind="props">
          <Icon icon="solar:bell-line-duotone" width="20" />
        </v-btn>
      </v-badge>
    </template>

    <div class="notif-popover">
      <div class="notif-head">
        <span class="notif-title">Notifications</span>
        <button
          v-if="notificationsStore.unreadCount > 0"
          class="mark-all-btn"
          @click="notificationsStore.markAllAsRead()"
        >
          Tout marquer comme lu
        </button>
      </div>

      <div v-if="notificationsStore.loading && !notificationsStore.hasLoadedOnce" class="notif-loading">
        <v-progress-circular indeterminate color="secondary" size="24" />
      </div>

      <div v-else-if="notificationsStore.items.length === 0" class="notif-empty">
        <Icon icon="solar:bell-off-line-duotone" width="28" />
        <p>Aucune notification pour le moment.</p>
      </div>

      <div v-else ref="scrollEl" class="notif-list" @scroll="onScroll">
        <button
          v-for="n in notificationsStore.items" :key="n.id"
          class="notif-item" :class="{ unread: !n.readAt }"
          @click="onNotificationClick(n)"
        >
          <div class="notif-icon" :class="`text-${n.color}`">
            <Icon :icon="n.icon" width="18" />
          </div>
          <div class="notif-body">
            <div class="notif-item-title">{{ n.title }}</div>
            <div class="notif-message">{{ n.message }}</div>
            <div class="notif-time">{{ timeAgo(n.createdAt) }}</div>
          </div>
          <span v-if="!n.readAt" class="unread-dot" />
        </button>

        <div v-if="notificationsStore.loading && notificationsStore.hasLoadedOnce" class="notif-loading-more">
          <v-progress-circular indeterminate color="secondary" size="18" />
        </div>
      </div>
    </div>
  </v-menu>
</template>

<style scoped>
.notif-popover {
  background: rgb(var(--v-theme-surface));
  border-radius: var(--r-lg);
  width: 340px;
  max-width: 90vw;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}
.notif-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.notif-title { font-size: 13.5px; font-weight: 700; }
.mark-all-btn {
  background: none; border: none; cursor: pointer;
  font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-secondary));
}

.notif-loading, .notif-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 32px 16px; color: rgb(var(--v-theme-on-surface-variant));
}
.notif-empty p { font-size: 12px; }

.notif-list { max-height: 380px; overflow-y: auto; }
.notif-item {
  display: flex; align-items: flex-start; gap: 10px;
  width: 100%; padding: 12px 16px; background: none; border: none;
  cursor: pointer; text-align: left; position: relative;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.04);
  transition: background .15s;
}
.notif-item:hover { background: rgb(var(--v-theme-surface-variant)); }
.notif-item.unread { background: rgba(var(--v-theme-secondary), 0.04); }
.notif-item:last-child { border-bottom: none; }

.notif-icon {
  width: 32px; height: 32px; border-radius: var(--r-md);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.notif-icon.text-success   { background: rgba(76, 122, 76, 0.12);   color: #4C7A4C; }
.notif-icon.text-warning   { background: rgba(217, 164, 65, 0.15);  color: #B8862F; }
.notif-icon.text-error     { background: rgba(192, 83, 62, 0.12);   color: #C0533E; }
.notif-icon.text-info      { background: rgba(110, 143, 184, 0.15); color: #6E8FB8; }
.notif-icon.text-secondary { background: rgba(var(--v-theme-secondary), 0.1); color: rgb(var(--v-theme-secondary)); }

.notif-body { flex: 1; min-width: 0; }
.notif-item-title { font-size: 12.5px; font-weight: 700; }
.notif-message { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }
.notif-time { font-size: 10px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 4px; }

.unread-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: rgb(var(--v-theme-secondary)); flex-shrink: 0; margin-top: 4px;
}

.notif-loading-more { display: flex; justify-content: center; padding: 12px; }

@media (max-width: 960px) {
  .notif-popover { width: 320px; }
}
</style>