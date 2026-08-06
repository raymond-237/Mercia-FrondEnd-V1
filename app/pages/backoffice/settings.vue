<script setup lang="ts">
import { useAdminSettingsStore } from '~/stores/Models/settings.store'


definePageMeta({ layout: 'admin' })

const store = useAdminSettingsStore()
const route = useRoute()

onMounted(() => {
  if (!store.settings) store.fetchSettings()
})

const NAV_ITEMS = [
  { key: 'profile',       label: 'Profil',          icon: 'solar:user-circle-line-duotone',           to: '/backoffice/settings/profile' },
  { key: 'general',       label: 'Général',        icon: 'solar:settings-line-duotone',              to: '/backoffice/settings/general' },
  { key: 'shop',          label: 'Boutique',        icon: 'solar:shop-line-duotone',                  to: '/backoffice/settings/shop' },
  { key: 'hero',          label: 'Vitrine',         icon: 'solar:gallery-wide-line-duotone',          to: '/backoffice/settings/hero' },
  { key: 'payment',       label: 'Paiement',        icon: 'solar:card-line-duotone',                  to: '/backoffice/settings/payment' },
  { key: 'notifications', label: 'Notifications',   icon: 'solar:bell-line-duotone',                  to: '/backoffice/settings/notifications' },
  { key: 'security',      label: 'Sécurité',        icon: 'solar:shield-check-line-duotone',          to: '/backoffice/settings/security' },
  { key: 'team',          label: 'Équipe',          icon: 'solar:users-group-rounded-line-duotone',   to: '/backoffice/settings/team' },
]

const activeKey = computed(() => NAV_ITEMS.find(i => route.path.startsWith(i.to))?.key ?? 'profile')
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[{ label: 'Réglages', icon: 'solar:settings-line-duotone' }]" />

    <div class="settings-layout">

      <nav class="settings-nav">
        <NuxtLink
          v-for="item in NAV_ITEMS" :key="item.key"
          :to="item.to"
          class="nav-item" :class="{ active: activeKey === item.key }"
        >
          <Icon :icon="item.icon" width="25" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="settings-content">
        <NuxtPage />
      </div>

    </div>

  </div>
</template>

<style scoped>
.settings-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-nav {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.settings-nav::-webkit-scrollbar { display: none; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  padding: 10px 16px;
  border-radius: var(--r-full);
  background: rgb(var(--v-theme-surface));
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface-variant));
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 700;
  transition: border-color .2s, color .2s, background .2s;
}
.nav-item.active {
  border-color: rgb(var(--v-theme-secondary));
  color: rgb(var(--v-theme-secondary));
  background: rgba(var(--v-theme-secondary), 0.06);
}

.settings-content { min-width: 0; }

@media (min-width: 960px) {
  .settings-layout {
    flex-direction: row;
    align-items: flex-start;
  }

  .settings-nav {
    flex-direction: column;
    width: 220px;
    flex-shrink: 0;
    overflow: visible;
    gap: 4px;
  }
  .nav-item {
    justify-content: flex-start;
    padding: 11px 14px;
    border-radius: var(--r-lg);
  }

  .settings-content { flex: 1; }
}
</style>