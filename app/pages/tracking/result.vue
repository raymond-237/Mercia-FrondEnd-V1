<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOrdersStore } from '~/stores/Models/order.store'
import type { TrackingResult } from '~/types/Models/Ordertracking'

definePageMeta({ layout: 'form' })

const { t, locale } = useI18n()
const ordersStore = useOrdersStore()

const trackingResult = useState<TrackingResult | null>('orderTrackingResult', () => null)

onMounted(async () => {
  if (trackingResult.value) return

  // Arrivée directe sur cette page (refresh, lien partagé...) — on retente
  // avec la dernière recherche stockée en session, sinon retour au formulaire.
  if (import.meta.client) {
    const raw = sessionStorage.getItem('orderTrackingQuery')
    if (raw) {
      try {
        const { orderNumber, email } = JSON.parse(raw)
        const data = await ordersStore.fetchOrderTracking(orderNumber, email)
        if (data) {
          trackingResult.value = mapTrackingResult(data)
          return
        }
      } catch {
        // silencieux — on retombe sur la redirection ci-dessous
      }
    }
  }

  await navigateTo('/order-tracking')
})

const result = computed(() => trackingResult.value)

const statusLabels = computed<Record<string, string>>(() => ({
  pending:   t('order.status.pending'),
  confirmed: t('order.status.confirmed'),
  shipped:   t('order.status.shipped'),
  delivered: t('order.status.delivered'),
}))

const STATUS_ICONS: Record<string, string> = {
  pending:   'solar:clock-circle-line-duotone',
  confirmed: 'solar:check-circle-bold-duotone',
  shipped:   'solar:delivery-line-duotone',
  delivered: 'solar:home-2-line-duotone',
}

const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered']

// Les libellés/icônes des étapes 3-4 changent selon retrait vs livraison,
// la progression backend (pending → confirmed → shipped → delivered) ne bouge pas.
const steps = computed(() => {
  if (result.value?.isPickup) {
    return [
      { key: 'pending',   label: t('order.tracking.steps.pending'),        icon: 'solar:clock-circle-line-duotone' },
      { key: 'confirmed', label: t('order.tracking.steps.confirmed'),      icon: 'solar:check-circle-line-duotone' },
      { key: 'shipped',   label: t('order.tracking.steps.readyForPickup'), icon: 'solar:shop-line-duotone' },
      { key: 'delivered', label: t('order.tracking.steps.pickedUp'),       icon: 'solar:bag-check-line-duotone' },
    ]
  }
  return [
    { key: 'pending',   label: t('order.tracking.steps.pending'),   icon: 'solar:clock-circle-line-duotone' },
    { key: 'confirmed', label: t('order.tracking.steps.confirmed'), icon: 'solar:check-circle-line-duotone' },
    { key: 'shipped',   label: t('order.tracking.steps.shipped'),   icon: 'solar:delivery-line-duotone' },
    { key: 'delivered', label: t('order.tracking.steps.delivered'), icon: 'solar:home-2-line-duotone' },
  ]
})

const currentStepIndex = computed(() => STATUS_ORDER.indexOf(result.value?.status ?? 'pending'))

function stepState(index: number): 'done' | 'current' | 'upcoming' {
  if (index < currentStepIndex.value) return 'done'
  if (index === currentStepIndex.value) return 'current'
  return 'upcoming'
}

function formatDate(dateStr: string, withTime = true): string {
  try {
    return new Intl.DateTimeFormat(locale.value, {
      day: 'numeric', month: 'short', year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

const deliveryEstimateLabel = computed(() => {
  const r = result.value
  if (!r || r.isPickup || r.isDelivered) return null
  if (r.estimatedDeliveryMin && r.estimatedDeliveryMax) {
    return t('order.confirmation.deliveryRange', { min: r.estimatedDeliveryMin, max: r.estimatedDeliveryMax })
  }
  return t('order.confirmation.deliveryFallback')
})

const mapsUrl = computed(() => {
  if (!result.value?.pickupAddress) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.value.pickupAddress)}`
})

const phoneHref = computed(() => {
  if (!result.value?.pickupPhone) return null
  return `tel:${result.value.pickupPhone.replace(/\s+/g, '')}`
})

function newSearch() {
  trackingResult.value = null
  if (import.meta.client) sessionStorage.removeItem('orderTrackingQuery')
  navigateTo('/tracking')
}
</script>

<template>
  <div class="tracking-page">
    <div class="content">
      <div class="tracking-wrapper">

        <div v-if="!result" class="loading-block">
          <v-progress-circular indeterminate color="secondary" size="28" />
        </div>

        <template v-else>
          <button type="button" class="back-link" @click="newSearch">
            <Icon icon="solar:arrow-left-line-duotone" width="23" />
            {{ t('order.tracking.backToSearch') }}
          </button>

          <div class="order-card">

            <div class="order-card-head">
              <div>
                <div class="order-card-label">{{ t('order.tracking.orderNumber') }}</div>
                <div class="order-card-number">{{ result.orderNumber }}</div>
                <div v-if="result.shippingMethodName" class="order-card-method">
                  <Icon :icon="result.isPickup ? 'solar:shop-line-duotone' : 'solar:delivery-line-duotone'" width="18" />
                  {{ result.shippingMethodName }}
                </div>
                <div v-if="result.orderDate" class="order-card-date">
                  {{ t('order.tracking.orderDate') }} {{ formatDate(result.orderDate, false) }}
                </div>
              </div>
              <div class="status-pill" :class="result.status">
                <Icon :icon="STATUS_ICONS[result.status]" width="14" />
                {{ statusLabels[result.status] ?? result.status }}
              </div>
            </div>

            <div v-if="deliveryEstimateLabel" class="delivery-estimate">
              <Icon icon="solar:calendar-line-duotone" width="15" />
              {{ t('order.confirmation.deliveryEstimate') }} {{ deliveryEstimateLabel }}
            </div>

            <!-- Timeline -->
            <div class="timeline">
              <div
                v-for="(step, index) in steps" :key="step.key"
                class="timeline-step" :class="stepState(index)"
              >
                <div class="timeline-marker">
                  <div class="timeline-circle">
                    <Icon v-if="stepState(index) === 'done'" icon="solar:check-bold" width="13" />
                    <Icon v-else :icon="step.icon" width="14" />
                  </div>
                  <div v-if="index < steps.length - 1" class="timeline-line" :class="{ filled: stepState(index) === 'done' }" />
                </div>
                <div class="timeline-content">
                  <div class="timeline-label">{{ step.label }}</div>
                  <div v-if="result.statusDates?.[step.key]" class="timeline-date">
                    {{ formatDate(result.statusDates[step.key]) }}
                  </div>
                  <div v-else-if="stepState(index) === 'current'" class="timeline-date timeline-date--current">
                    {{ t('order.tracking.inProgress') }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Infos ramassage en magasin -->
            <div v-if="result.isPickup && currentStepIndex >= 2" class="info-block">
              <div class="info-block-title">
                <Icon icon="solar:shop-line-duotone" width="16" />
                {{ result.shippingMethodName || t('order.tracking.pickup.title') }}
              </div>
              <div v-if="result.pickupAddress" class="info-row">
                <Icon icon="solar:map-point-line-duotone" width="14" />
                {{ result.pickupAddress }}
              </div>
              <div v-if="result.pickupHours" class="info-row">
                <Icon icon="solar:calendar-line-duotone" width="14" />
                {{ result.pickupHours }}
              </div>
              <a v-if="result.pickupPhone" :href="phoneHref" class="info-row info-row--link">
                <Icon icon="solar:phone-line-duotone" width="14" />
                {{ result.pickupPhone }}
              </a>
              <p v-if="result.pickupInstructions" class="info-note">
                {{ result.pickupInstructions }}
              </p>

              <div class="pickup-actions">
                <a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener" class="pickup-action-btn">
                  <Icon icon="solar:routing-2-line-duotone" width="15" />
                  {{ t('order.tracking.pickup.getDirections') }}
                </a>
                <a v-if="phoneHref" :href="phoneHref" class="pickup-action-btn">
                  <Icon icon="solar:phone-calling-line-duotone" width="15" />
                  {{ t('order.tracking.pickup.call') }}
                </a>
              </div>
            </div>

            <!-- Suivi transporteur -->
            <div v-else-if="result.trackingNumber" class="info-block">
              <div class="info-block-title">
                <Icon icon="solar:delivery-line-duotone" width="16" />
                {{ t('order.tracking.trackingNumber') }}
              </div>
              <div class="tracking-num">{{ result.trackingNumber }}</div>
              <a v-if="result.trackingUrl" :href="result.trackingUrl" class="tracking-link" target="_blank">
                {{ t('order.tracking.trackPackage') }}
                <Icon icon="solar:arrow-right-up-line-duotone" width="16" />
              </a>
            </div>

            <div v-if="result.isDelivered" class="return-link-block">
              <NuxtLink to="/returns" class="return-link">
                <Icon icon="solar:undo-left-line-duotone" width="15" />
                {{ t('order.tracking.requestReturn') }}
              </NuxtLink>
            </div>

          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<style scoped>
.tracking-page {}
.content { padding: 0 24px 40px; }

.tracking-wrapper { max-width: 420px; margin: 32px auto; }

.loading-block {
  display: flex; justify-content: center; padding: 64px 0;
}

.back-link {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font-size: 12.5px; font-weight: 700;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 20px 0 14px; padding: 0;
}
.back-link:hover { color: rgb(var(--v-theme-secondary)); }

/* Card résultat */
.order-card {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg); padding: 20px;
}

.order-card-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 10px; margin-bottom: 14px;
}
.order-card-label {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 2px;
}
.order-card-number { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; }
.order-card-method {
  display: flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 600;
  /* border-radius: 40px; */
  color: rgb(var(--v-theme-on-surface-variant)); margin-top: 3px;
}
.order-card-date {
  font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 3px;
}

.status-pill {
  display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
  padding: 6px 12px; border-radius: var(--r-sm);
  font-size: 11.5px; font-weight: 700;
  background: rgb(var(--v-theme-surface));
}
.status-pill.shipped   { color: #C68A52; }
.status-pill.delivered { color: #4C7A4C; }

.delivery-estimate {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 600;
  color: rgb(var(--v-theme-secondary));
  background: rgb(var(--v-theme-surface));
  border-radius: var(--r-md);
  padding: 10px 12px;
  margin-bottom: 18px;
}

/* Timeline verticale */
.timeline { margin-bottom: 4px; }

.timeline-step { display: flex; gap: 14px; }

.timeline-marker { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
.timeline-circle {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface-variant));
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.1);
  transition: background .25s, color .25s, border-color .25s;
}
.timeline-line {
  width: 2px; flex: 1; min-height: 26px;
  background: rgba(var(--v-theme-on-surface), 0.1);
  transition: background .25s;
}
.timeline-line.filled { background: rgb(var(--v-theme-secondary)); }

.timeline-step.done .timeline-circle {
  background: rgb(var(--v-theme-secondary));
  color: rgb(var(--v-theme-on-secondary, 255 255 255));
  border-color: rgb(var(--v-theme-secondary));
}
.timeline-step.current .timeline-circle {
  background: rgba(var(--v-theme-secondary), 0.12);
  color: rgb(var(--v-theme-secondary));
  border-color: rgb(var(--v-theme-secondary));
  animation: pulse-ring 1.8s ease-out infinite;
}
.timeline-step.upcoming .timeline-circle {
  opacity: 0.55;
}

@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(var(--v-theme-secondary), 0.35); }
  70%  { box-shadow: 0 0 0 7px rgba(var(--v-theme-secondary), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--v-theme-secondary), 0); }
}

.timeline-content { padding-bottom: 22px; padding-top: 3px; }
.timeline-step:last-child .timeline-content { padding-bottom: 0; }

.timeline-label {
  font-size: 13px; font-weight: 700;
  color: rgb(var(--v-theme-on-surface-variant));
}
.timeline-step.done .timeline-label,
.timeline-step.current .timeline-label {
  color: rgb(var(--v-theme-on-surface));
}
.timeline-date { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }
.timeline-date--current { color: rgb(var(--v-theme-secondary)); font-weight: 700; }

/* Bloc infos pickup / transporteur */
.info-block {
  background: rgb(var(--v-theme-surface));
  border-radius: var(--r-md);
  padding: 14px 16px;
  margin-top: 18px;
  margin-bottom: 12px;
}
.info-block-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 11.5px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 10px;
}
.info-row {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 600; margin-bottom: 6px;
  text-decoration: none; color: rgb(var(--v-theme-on-surface));
}
.info-row--link { color: rgb(var(--v-theme-secondary)); }
.info-row:last-of-type { margin-bottom: 0; }
.info-note {
  font-size: 12px; color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 8px; padding-top: 8px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.1);
  line-height: 1.5;
}

.pickup-actions {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  margin-top: 14px;
}
.pickup-action-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; border-radius: var(--r-lg);
  background: rgba(var(--v-theme-secondary), 0.1);
  color: rgb(var(--v-theme-secondary));
  font-size: 12px; font-weight: 700; text-decoration: none;
}

.tracking-num { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.tracking-link {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12.5px; font-weight: 700; color: rgb(var(--v-theme-secondary)); text-decoration: none;
}

.return-link-block { border-top: 1px solid rgb(var(--v-theme-outline)); padding-top: 14px; margin-top: 4px; }
.return-link {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 600; color: rgb(var(--v-theme-secondary)); text-decoration: none;
}
</style>