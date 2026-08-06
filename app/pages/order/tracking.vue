<script setup lang="ts">
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { useI18n } from 'vue-i18n'
import { useOrdersStore } from '~/stores/Models/order.store'
import { buildTrackingUrl } from '~/@cores/constantes/carriers'

definePageMeta({ layout: 'form' })

const { t, locale } = useI18n()
const ordersStore = useOrdersStore()

const validationSchema = computed(() => yup.object({
  orderNumber: yup.string().required(t('order.validation.orderNumberRequired')),
  email:       yup.string().email(t('order.validation.emailInvalid')).required(t('order.validation.emailRequired')),
}))

const { handleSubmit } = useForm({ validationSchema })

const { value: orderNumber, errorMessage: errOrder } = useField<string>('orderNumber')
const { value: email,       errorMessage: errEmail } = useField<string>('email')

const loading = ref(false)
const result  = ref<any>(null)
const error   = ref('')

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  error.value   = ''
  result.value  = null

  const data = await ordersStore.fetchOrderTracking(values.orderNumber, values.email)

  if (data) {
    result.value = {
      orderNumber:    data.orderNumber,
      status:         data.status,
      trackingNumber: data.trackingNumber ?? null,
      // Construite ici, pas renvoyée par le backend — évite de dupliquer
      // la liste des transporteurs (carriers.ts) côté PHP.
      trackingUrl:    data.carrierCode && data.trackingNumber
        ? buildTrackingUrl(data.carrierCode, data.trackingNumber)
        : null,
      isDelivered:    data.status === 'delivered',

      // Nom réel de la méthode choisie par le client — saisi librement par
      // l'admin dans AdminDrawerMethod.vue (jamais hardcodé ici : "Standard",
      // "Express", "Retrait Milano Centro"... peu importe le libellé exact).
      shippingMethodName: data.shippingMethodName ?? null,

      // Ramassage en magasin — bascule tout l'affichage post-timeline
      // (adresse/horaires au lieu du numéro de suivi transporteur).
      isPickup:            data.isPickup ?? false,
      pickupAddress:       data.pickupAddress ?? null,
      pickupHours:         data.pickupHours ?? null,
      pickupInstructions:  data.pickupInstructions ?? null,
      pickupPhone:         data.pickupPhone ?? null,

      // Horodatage par étape, optionnel — si absent, seule l'étape en
      // cours affiche "En cours" et les autres restent muettes.
      statusDates: data.statusDates ?? null,
    }
  } else {
    error.value = ordersStore.trackingError ?? t('order.tracking.notFound')
  }

  loading.value = false
})

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

// Les libellés/icônes des étapes 3 et 4 changent selon retrait vs livraison,
// mais la logique de progression (pending → confirmed → shipped → delivered)
// reste identique côté backend — on ne fait que ré-habiller l'affichage.
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

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="tracking-page">
    <div class="content">
      <div class="tracking-wrapper">

        <div class="page-icon">
          <Icon icon="solar:delivery-line-duotone" width="35" />
        </div>
        <h1>{{ t('order.tracking.title') }}</h1>
        <p class="sub">{{ t('order.tracking.subtitle') }}</p>

        <form @submit.prevent="onSubmit">
          <v-text-field
            v-model="orderNumber"
            :label="t('order.tracking.orderNumber')"
            :placeholder="t('order.tracking.orderNumberPlaceholder')"
            variant="solo-filled"
            flat rounded="xl"
            density="comfortable"
            :error-messages="errOrder"
            autocomplete="off"
            class="mb-3"
          >
            <template #prepend-inner>
              <Icon icon="solar:bill-list-line-duotone" width="18" />
            </template>
          </v-text-field>
          <v-text-field
            v-model="email"
            :label="t('order.tracking.email')"
            type="email"
            variant="solo-filled"
            flat rounded="xl"
            density="comfortable"
            :error-messages="errEmail"
            autocomplete="email"
            class="mb-4"
          >
            <template #prepend-inner>
              <Icon icon="solar:letter-line-duotone" width="18" />
            </template>
          </v-text-field>

          <v-btn
            type="submit" block rounded="pill" size="large" color="primary"
            :loading="loading"
          >
            {{ t('order.tracking.search') }}
            <Icon icon="solar:magnifer-line-duotone" width="16" style="margin-left: 6px;" />
          </v-btn>
        </form>

        <!-- Erreur -->
        <v-expand-transition>
          <div v-if="error" class="error-block">
            <Icon icon="solar:danger-triangle-line-duotone" width="18" />
            {{ error }}
          </div>
        </v-expand-transition>

        <!-- Résultat -->
        <v-expand-transition>
          <div v-if="result" class="order-card">

            <div class="order-card-head">
              <div>
                <div class="order-card-label">{{ t('order.tracking.orderNumber') }}</div>
                <div class="order-card-number">{{ result.orderNumber }}</div>
                <div v-if="result.shippingMethodName" class="order-card-method">
                  <Icon :icon="result.isPickup ? 'solar:shop-line-duotone' : 'solar:delivery-line-duotone'" width="13" />
                  {{ result.shippingMethodName }}
                </div>
              </div>
              <div class="status-pill" :class="result.status">
                <Icon :icon="STATUS_ICONS[result.status]" width="14" />
                {{ statusLabels[result.status] ?? result.status }}
              </div>
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
              <div v-if="result.pickupPhone" class="info-row">
                <Icon icon="solar:phone-line-duotone" width="14" />
                {{ result.pickupPhone }}
              </div>
              <p v-if="result.pickupInstructions" class="info-note">
                {{ result.pickupInstructions }}
              </p>
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
        </v-expand-transition>

      </div>
    </div>
  </div>
</template>

<style scoped>
.tracking-page {}
.content { padding: 0 24px 40px; }

.tracking-wrapper { max-width: 420px; margin: 32px auto; }

.page-icon {
  width: 56px; height: 56px; border-radius: var(--r-lg);
  background: rgb(var(--v-theme-surface-variant));
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary)); margin-bottom: 16px;
}
h1 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; margin-bottom: 6px; }
.sub { font-size: 13px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 24px; }

.error-block {
  display: flex; align-items: center; gap: 8px;
  background: rgba(192, 83, 62, 0.1);
  color: #C0533E; border-radius: var(--r-lg); padding: 14px;
  font-size: 13px; font-weight: 600; margin-top: 16px;
}

/* Card résultat */
.order-card {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg); padding: 20px; margin-top: 20px;
}

.order-card-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 10px; margin-bottom: 22px;
}
.order-card-label {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 2px;
}
.order-card-number { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; }
.order-card-method {
  display: flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant)); margin-top: 3px;
}

.status-pill {
  display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
  padding: 6px 12px; border-radius: var(--r-sm);
  font-size: 11.5px; font-weight: 700;
  background: rgb(var(--v-theme-surface));
}
.status-pill.shipped   { color: #C68A52; }
.status-pill.delivered { color: #4C7A4C; }

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
  margin-top: 6px;
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
}
.info-row:last-of-type { margin-bottom: 0; }
.info-note {
  font-size: 12px; color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 8px; padding-top: 8px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.1);
  line-height: 1.5;
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