<script setup lang="ts">

const notificationStore = useNotificationStore()

const CONFIG: Record<string, { icon: string; accent: string }> = {
  success: { icon: 'solar:check-circle-bold-duotone',      accent: '#4C7A4C' },
  error:   { icon: 'solar:danger-triangle-bold-duotone',   accent: '#C0533E' },
  warning: { icon: 'solar:danger-triangle-bold-duotone',   accent: '#B8862F' },
  info:    { icon: 'solar:info-circle-bold-duotone',       accent: '#6E8FB8' },
  default: { icon: 'solar:bell-bold-duotone',              accent: 'rgb(var(--v-theme-secondary))' },
}

const current = computed(() => CONFIG[notificationStore.color] ?? CONFIG.default)
</script>

<template>
  <v-snackbar
    v-model="notificationStore.visible"
    :timeout="notificationStore.timeout"
    location="bottom right"
    transition="scale-transition"
    content-class="notify-snackbar-content"
    :style="{ '--notify-accent': current.accent }"
  >
    <div class="notify-body">
      <div class="notify-icon">
        <Icon :icon="current.icon" width="20" />
      </div>
      <p class="notify-message">{{ notificationStore.message }}</p>
      <button class="notify-close" @click="notificationStore.close()">
        <Icon icon="solar:close-circle-line-duotone" width="18" />
      </button>
    </div>
  </v-snackbar>
</template>

<style>
/* Vuetify rend le contenu du v-snackbar dans un overlay global,
   donc ces styles ne peuvent pas être scoped — on cible via une
   classe unique (content-class) pour rester isolé du reste de l'app. */

.notify-snackbar-content .v-snackbar__wrapper {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  min-width: 0 !important;
}

.notify-body {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgb(var(--v-theme-surface));
  border-radius: var(--r-lg);
  padding: 14px 14px 14px 12px;
  min-width: 280px;
  max-width: 380px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.14);
  border-left: 3px solid var(--notify-accent);
}

.notify-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--notify-accent);
  background: color-mix(in srgb, var(--notify-accent) 14%, transparent);
}

.notify-message {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.4;
  margin: 0;
}

.notify-close {
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  color: rgb(var(--v-theme-on-surface-variant));
  display: flex;
  transition: color .2s;
}
.notify-close:hover { color: rgb(var(--v-theme-on-surface)); }
</style>