<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOrdersStore } from '~/stores/Models/order.store'

definePageMeta({ layout: 'form' })

type StepState = 'done' | 'current' | 'todo'

interface Step {
  state: StepState
  title: string
  sub?: string
}

interface MethodConfig {
  pending: boolean
  title: string
  subtitle: string
  amountLabel: string
  status: {
    label: string
    color: string
    icon: string
  }| null
  steps: Step[]
}

const { t } = useI18n()
const route = useRoute()
const sf = useStorefront()
const toast = useToast()
const ordersStore = useOrdersStore()

const orderNumber = computed(() => (route.query.order as string) ?? '')
const copied = ref(false)
const hydrated = ref(false)

const order = computed(() => {
  const last = ordersStore.lastOrder
  return last && last.orderNumber === orderNumber.value ? last : null
})

const details = computed(() => order.value?.paymentDetails ?? null)

const isBankTransfer = computed(() => order.value?.paymentMethod === 'bank_transfer')
const isCash = computed(() => order.value?.paymentMethod === 'cash')

const config = computed<MethodConfig>(() => {
  const k = (key: string) => t(`order.confirmation.${key}`)

  if (isBankTransfer.value) {
    return {
      pending: true,
      title: k('titlePending'),
      subtitle: k('subtitleBank'),
      amountLabel: k('amountToTransfer'),
      status: {
        label: k('statusPending'),
        color: 'secondary',
        icon: 'solar:clock-circle-line-duotone',
      },
      steps: [
        { state: 'done', title: k('stepReceived'), sub: k('stepReceivedSub') },
        { state: 'current', title: k('stepTransferPending'), sub: k('stepTransferPendingSub') },
        { state: 'todo', title: k('stepShipping') },
      ],
    }
  }

  if (isCash.value) {
    return {
      pending: false,
      title: k('title'),
      subtitle: k('subtitleCash'),
      amountLabel: k('amountAtPickup'),
      status: {
        label: k('statusOnSite'),
        color: 'secondary',
        icon: 'solar:wallet-line-duotone',
      },
      steps: [
        { state: 'done', title: k('stepReceived'), sub: k('stepReceivedSub') },
        { state: 'current', title: k('stepPickupPreparing'), sub: k('stepPickupPreparingSub') },
        { state: 'todo', title: k('stepPickupCollect') },
      ],
    }
  }

  if (order.value?.paymentMethod === 'paypal') {
    return {
      pending: false,
      title: k('title'),
      subtitle: k('subtitlePaid'),
      amountLabel: k('amountPaid'),
      status: {
        label: k('statusPaid'),
        color: 'success',
        icon: 'solar:check-circle-line-duotone',
      },
      steps: [
        { state: 'done', title: k('stepPaymentConfirmed'), sub: k('stepPaymentConfirmedSub') },
        { state: 'current', title: k('stepPreparing'), sub: k('stepPreparingSub') },
        { state: 'todo', title: k('stepShipping'), sub: k('stepShippingSub') },
      ],
    }
  }

  return {
    pending: false,
    title: k('title'),
    subtitle: k('subtitleFallback'),
    amountLabel: k('amountTotal'),
    status: null,
    steps: [
      { state: 'done', title: k('stepReceived'), sub: k('stepReceivedSub') },
      { state: 'todo', title: k('stepPreparing') },
    ],
  }
})

const heroTitle = computed(() => (order.value ? config.value.title : t('order.confirmation.title')))
const heroSubtitle = computed(() => (order.value ? config.value.subtitle : t('order.confirmation.subtitleFallback')))
const heroPending = computed(() => !!order.value && config.value.pending)

const deliveryLabel = computed(() => {
  const method = order.value?.shippingMethod

  if (method?.minDays && method?.maxDays) {
    return t('order.confirmation.deliveryRange', { min: method.minDays, max: method.maxDays })
  }

  return t('order.confirmation.deliveryFallback')
})

const itineraryUrl = computed(() => {
  const address = details.value?.pickupAddress
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ''
})

function stepIcon(state: StepState) {
  if (state === 'done') return 'solar:check-read-line-duotone'
  if (state === 'current') return 'solar:clock-circle-line-duotone'
  return ''
}

async function copyOrder() {
  if (!import.meta.client || !orderNumber.value) return

  try {
    await navigator.clipboard.writeText(orderNumber.value)
    navigator.vibrate?.(10)
  } catch {}

  copied.value = true
  toast.success(t('order.confirmation.copied'))
  setTimeout(() => { copied.value = false }, 1800)
}

onMounted(() => {
  ordersStore.restoreLastOrder()
  hydrated.value = true
  sf.clearCart()
})
</script>

<template>
  <div class="confirmation-page">
    <div class="ambient" aria-hidden="true">
      <div class="blob blob-1" />
      <div class="blob blob-2" />
      <div class="blob blob-3" />
    </div>

    <div class="confirmation-content">
      <div v-if="!hydrated" class="loading-block">
        <v-progress-circular indeterminate color="secondary" size="28" />
      </div>

      <template v-else>
        <section class="hero reveal">
          <div class="orb" :class="{ 'orb--pending': heroPending }">
            <Icon
              :icon="heroPending ? 'solar:hourglass-line-duotone' : 'solar:check-circle-line-duotone'"
              width="40"
            />
          </div>

          <h1>{{ heroTitle }}</h1>
          <p class="sub">{{ heroSubtitle }}</p>

          <button v-if="orderNumber" class="order-pill" @click="copyOrder">
            <span class="order-pill-label">{{ t('order.confirmation.orderLabel') }}</span>
            <span class="order-pill-value">{{ orderNumber }}</span>
            <span class="order-pill-icon">
              <Icon
                :icon="copied ? 'solar:check-circle-line-duotone' : 'solar:copy-line-duotone'"
                width="15"
              />
            </span>
          </button>
        </section>

        <template v-if="order">
          <section class="glass summary reveal">
            <div class="amount-row">
              <div class="amount-text">
                <span class="amount-label">{{ config.amountLabel }}</span>
                <span class="amount-value">{{ order.total.toFixed(2) }}€</span>
              </div>

              <v-chip
                 v-if="config.status"
                :color="config.status.color"
                variant="tonal"
                size="small"
                rounded="pill"
                class="status-chip"
              >
                <Icon :icon="config.status.icon" width="13" class="status-chip-icon" />
                {{ config.status.label }}
              </v-chip>
            </div>

            <ol class="steps">
              <li
                v-for="(step, i) in config.steps"
                :key="i"
                class="step"
                :class="`step--${step.state}`"
              >
                <span class="step-dot">
                  <Icon v-if="stepIcon(step.state)" :icon="stepIcon(step.state)" width="14" />
                  <span v-else class="step-dot-inner" />
                </span>

                <span class="step-text">
                  <span class="step-title">{{ step.title }}</span>
                  <span v-if="step.sub" class="step-sub">{{ step.sub }}</span>
                </span>
              </li>
            </ol>
          </section>

          <UiBankTransferCard
            v-if="isBankTransfer && details?.iban"
            class="reveal"
            :beneficiary="details.accountHolder ?? ''"
            :iban="details.iban"
            :bic="details.bic ?? undefined"
            :amount="order.total"
            :reference="order.orderNumber"
          />

          <section v-else-if="isBankTransfer" class="glass info-card reveal">
            <div class="info-icon">
              <Icon icon="solar:letter-line-duotone" width="20" />
            </div>

            <div class="info-body">
              <span class="info-title">{{ t('order.confirmation.fallbackTitle') }}</span>
              <span class="info-text">{{ t('order.confirmation.bankDetailsByEmail') }}</span>
            </div>
          </section>

          <section v-if="isCash && details?.pickupAddress" class="glass info-card reveal">
            <div class="info-icon">
              <Icon icon="solar:map-point-line-duotone" width="20" />
            </div>

            <div class="info-body">
              <span class="info-title">{{ t('order.confirmation.pickupTitle') }}</span>
              <span class="info-text">{{ details.pickupAddress }}</span>

              <span v-if="details.pickupHours" class="info-meta">
                <Icon icon="solar:clock-circle-line-duotone" width="14" />
                {{ details.pickupHours }}
              </span>

              <v-btn
                :href="itineraryUrl"
                target="_blank"
                rel="noopener"
                variant="tonal"
                color="secondary"
                rounded="pill"
                size="small"
                class="info-action"
              >
                <Icon icon="solar:routing-line-duotone" width="15" class="btn-icon-left" />
                {{ t('order.confirmation.itinerary') }}
              </v-btn>
            </div>
          </section>

          <section v-if="!isCash" class="glass info-card reveal">
            <div class="info-icon">
              <Icon icon="solar:delivery-line-duotone" width="20" />
            </div>

            <div class="info-body">
              <span class="info-title">{{ t('order.confirmation.deliveryTitle') }}</span>
              <span class="info-text">{{ deliveryLabel }}</span>
            </div>
          </section>
        </template>

        <section v-else class="glass info-card reveal">
          <div class="info-icon">
            <Icon icon="solar:letter-line-duotone" width="20" />
          </div>

          <div class="info-body">
            <span class="info-title">{{ t('order.confirmation.fallbackTitle') }}</span>
            <span class="info-text">{{ t('order.confirmation.fallbackText') }}</span>
          </div>
        </section>

        <div class="actions reveal">
          <v-btn
            to="/tracking"
            color="primary"
            variant="flat"
            rounded="pill"
            size="large"
            block
            class="action-primary"
          >
            {{ t('order.confirmation.trackOrder') }}
            <Icon icon="solar:arrow-right-line-duotone" width="16" class="btn-icon-right" />
          </v-btn>

          <v-btn
            to="/shop"
            variant="tonal"
            rounded="pill"
            size="large"
            block
          >
            {{ t('order.confirmation.continueShopping') }}
          </v-btn>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.confirmation-page {
  position: relative;
  padding: 40px 16px 48px;
  overflow: hidden;
}

.ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.55;
}

.blob-1 {
  width: 320px;
  height: 320px;
  top: -120px;
  left: -100px;
  background: rgba(var(--v-theme-secondary), 0.35);
}

.blob-2 {
  width: 280px;
  height: 280px;
  top: 60px;
  right: -120px;
  background: rgba(var(--v-theme-warning), 0.4);
}

.blob-3 {
  width: 260px;
  height: 260px;
  bottom: 80px;
  left: 20%;
  background: rgba(var(--v-theme-success), 0.12);
}

.confirmation-content {
  position: relative;
  max-width: 440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-radius: 10px;
}

.loading-block {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 8px;
}

.orb {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  background: rgba(var(--v-theme-surface), 0.55);
  border: 1px solid rgba(var(--v-theme-surface), 0.9);
  box-shadow:
    0 18px 40px rgba(var(--v-theme-success), 0.18),
    inset 0 1px 0 rgb(var(--v-theme-surface));
  backdrop-filter: blur(18px);
  color: rgb(var(--v-theme-success));
  animation: orb-in .6s cubic-bezier(.2, .9, .3, 1.3) both;
}

.orb::after {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1.5px solid rgba(var(--v-theme-success), 0.25);
  animation: pulse 2.4s ease-out infinite;
}

.orb--pending {
  color: rgb(var(--v-theme-secondary));
  box-shadow:
    0 18px 40px rgba(var(--v-theme-secondary), 0.2),
    inset 0 1px 0 rgb(var(--v-theme-surface));
}

.orb--pending::after {
  border-color: rgba(var(--v-theme-secondary), 0.25);
}

.hero h1 {
  font-family: 'Fraunces', serif;
  font-size: 27px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin-bottom: 8px;
}

.sub {
  font-size: 13.5px;
  line-height: 1.55;
  color: rgb(var(--v-theme-on-surface-variant));
  max-width: 320px;
  margin-bottom: 18px;
}

.order-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px 9px 16px;
  border-radius: var(--r-full);
  border: 1px solid rgba(var(--v-theme-surface), 0.9);
  background: rgba(var(--v-theme-surface), 0.65);
  backdrop-filter: blur(14px);
  box-shadow: 0 6px 18px rgba(var(--v-theme-primary), 0.06);
  cursor: pointer;
  transition: transform .15s;
}

.order-pill:active {
  transform: scale(0.97);
}

.order-pill-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
}

.order-pill-value {
  font-family: 'Fraunces', serif;
  font-size: 15px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.order-pill-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-secondary));
}

.glass {
  background: rgba(var(--v-theme-surface), 0.72);
  border: 1px solid rgba(var(--v-theme-surface), 0.95);
  border-radius: var(--r-xl);
  box-shadow:
    inset 0 1px 0 rgb(var(--v-theme-surface)),
    0 12px 32px rgba(var(--v-theme-primary), 0.06);
  backdrop-filter: blur(20px);
}

.summary {
  padding: 18px;
}

.amount-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px dashed rgba(var(--v-theme-on-surface), 0.1);
}

.amount-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.amount-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
}

.amount-value {
  font-family: 'Fraunces', serif;
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1;
}

.status-chip {
  flex-shrink: 0;
  font-weight: 700;
}

.status-chip-icon {
  margin-right: 5px;
}

.steps {
  display: flex;
  flex-direction: column;
  list-style: none;
  padding: 0;
  margin: 0;
}

.step {
  position: relative;
  display: flex;
  gap: 12px;
  padding-bottom: 14px;
}

.step:last-child {
  padding-bottom: 0;
}

.step:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 26px;
  bottom: 2px;
  width: 2px;
  border-radius: 2px;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.step--done:not(:last-child)::before {
  background: rgba(var(--v-theme-success), 0.35);
}

.step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
}

.step-dot-inner {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.25);
}

.step--done .step-dot {
  background: rgb(var(--v-theme-success));
  color: rgb(var(--v-theme-on-success));
}

.step--current .step-dot {
  background: rgba(var(--v-theme-secondary), 0.14);
  color: rgb(var(--v-theme-secondary));
  box-shadow: 0 0 0 4px rgba(var(--v-theme-secondary), 0.08);
}

.step-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-top: 2px;
  min-width: 0;
}

.step-title {
  font-size: 13px;
  font-weight: 700;
}

.step--todo .step-title {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
}

.step-sub {
  font-size: 11.5px;
  line-height: 1.45;
  color: rgb(var(--v-theme-on-surface-variant));
}

.info-card {
  display: flex;
  gap: 14px;
  padding: 16px;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-secondary), 0.1);
  color: rgb(var(--v-theme-secondary));
}

.info-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.info-title {
  font-size: 14px;
  font-weight: 700;
}

.info-text {
  font-size: 12.5px;
  line-height: 1.5;
  color: rgb(var(--v-theme-on-surface-variant));
}

.info-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
}

.info-action {
  align-self: flex-start;
  margin-top: 10px;
}

.btn-icon-left {
  margin-right: 6px;
}

.btn-icon-right {
  margin-left: 6px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.action-primary {
  box-shadow: 0 10px 24px rgba(var(--v-theme-primary), 0.2);
}

.reveal {
  animation: reveal .5s ease both;
}

.reveal:nth-child(2) {
  animation-delay: .08s;
}

.reveal:nth-child(3) {
  animation-delay: .16s;
}

.reveal:nth-child(4) {
  animation-delay: .24s;
}

.reveal:nth-child(5) {
  animation-delay: .32s;
}

@keyframes orb-in {
  from {
    transform: scale(0.6);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 1;
  }

  100% {
    transform: scale(1.25);
    opacity: 0;
  }
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .orb,
  .orb::after,
  .reveal {
    animation: none;
  }
}
</style>