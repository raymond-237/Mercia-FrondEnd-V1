<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useAdminSettingsStore } from '~/stores/Models/settings.store'
import type { NotificationsFormData } from '~/types/Models/settings.type'

definePageMeta({ layout: 'admin' })

const store = useAdminSettingsStore()

const form = reactive<NotificationsFormData>({
  orderConfirmation: true,
  orderShipped: true,
  orderDelivered: false,
  lowStock: true,
  newReturn: true,
})

watch(() => store.settings, (s) => {
  if (!s) return
  Object.assign(form, s.notifications)
}, { immediate: true })

const ITEMS: { key: keyof NotificationsFormData; label: string; hint: string; icon: string }[] = [
  { key: 'orderConfirmation', label: 'Confirmation de commande', hint: 'Email envoyé au client dès qu\'une commande est passée', icon: 'solar:bag-check-line-duotone' },
  { key: 'orderShipped',      label: 'Commande expédiée',         hint: 'Email avec le numéro de suivi',                       icon: 'solar:delivery-line-duotone' },
  { key: 'orderDelivered',    label: 'Commande livrée',            hint: 'Email de confirmation de livraison',                  icon: 'solar:box-line-duotone' },
  { key: 'lowStock',          label: 'Stock faible',                hint: 'Alerte interne quand un produit passe sous le seuil', icon: 'solar:danger-triangle-line-duotone' },
  { key: 'newReturn',         label: 'Nouvelle demande de retour',  hint: 'Alerte interne à chaque nouvelle demande',            icon: 'solar:map-arrow-left-line-duotone' },
]

async function onSubmit() {
  const success = await store.saveNotifications(form)
  notify(success ? 'Préférences enregistrées.' : (store.error ?? 'Une erreur est survenue.'), success ? 'success' : 'error')
}
</script>

<template>
  <div>
    <div v-if="store.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <template v-else>
      <div class="panel">
        <h2>Notifications automatiques</h2>
        <p class="panel-hint">Emails et alertes envoyés automatiquement selon les événements.</p>

        <div class="notif-list">
          <div v-for="item in ITEMS" :key="item.key" class="notif-row">
            <div class="notif-icon"><Icon :icon="item.icon" width="18" /></div>
            <div class="notif-info">
              <div class="notif-title">{{ item.label }}</div>
              <div class="notif-hint">{{ item.hint }}</div>
            </div>
            <v-switch v-model="form[item.key]" density="compact" color="secondary" hide-details inset />
          </div>
        </div>
      </div>

      <div class="panel-foot standalone">
        <v-btn color="secondary" variant="flat" rounded="xl" :loading="store.saving" @click="onSubmit">
          <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
          Enregistrer
        </v-btn>
      </div>
    </template>
  </div>
</template>

<style scoped>
.loading-block { display: flex; justify-content: center; padding: 48px 0; }

.panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 20px; margin-bottom: 16px;
}
.panel h2 { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.panel-hint { font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 16px; }

.notif-list { display: flex; flex-direction: column; gap: 8px; }
.notif-row {
  display: flex; align-items: center; gap: 12px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg); padding: 12px 14px;
}
.notif-icon {
  width: 34px; height: 34px; border-radius: var(--r-md);
  background: rgba(var(--v-theme-secondary), 0.1); color: rgb(var(--v-theme-secondary));
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.notif-info { flex: 1; min-width: 0; }
.notif-title { font-size: 13px; font-weight: 700; }
.notif-hint { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }

.panel-foot.standalone { display: flex; justify-content: flex-end; }
</style>