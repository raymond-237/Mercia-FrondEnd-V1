<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOrdersStore } from '~/stores/Models/order.store'

definePageMeta({ layout: 'form' })

const { t }         = useI18n()
const route         = useRoute()
const sf            = useStorefront()
const ordersStore   = useOrdersStore()

const orderNumber = computed(() => (route.query.order as string) ?? '')
const copied       = ref(false)
const loading       = ref(true)
const order         = ref<any>(null)

async function copyOrder() {
  if (import.meta.client) {
    await navigator.clipboard.writeText(orderNumber.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

const deliveryLabel = computed(() => {
  const method = order.value?.shippingMethod
  if (method?.minDays && method?.maxDays) {
    return t('order.confirmation.deliveryRange', { min: method.minDays, max: method.maxDays })
  }
  return t('order.confirmation.deliveryFallback')
})

// ── Virement bancaire — relu depuis le store (rempli pendant le checkout),
// avec fallback si la page est ouverte après un rechargement complet
// (lien partagé, retour depuis l'email) où le store Pinia est vide.
const bankDetails = computed(
  () => ordersStore.paymentMethods.find(m => m.method === 'bank_transfer')
)

const loadOrder = async () => {
  if (!orderNumber.value) {
    loading.value = false
    return
  }
  try {
    order.value = await ordersStore.fetchOrder(orderNumber.value)

    if (order.value?.paymentMethod === 'bank_transfer' && !bankDetails.value && order.value?.shippingMethodId) {
      await ordersStore.fetchPaymentMethods(order.value.shippingMethodId)
    }
  } catch (e) {
    console.error('Erreur chargement commande confirmation:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrder()
  sf.clearCart()
})
</script>

<template>
  <div class="confirmation-page">
    <div class="confirmation-content">

      <div class="check-icon">
        <Icon icon="solar:check-circle-bold-duotone" width="56" />
      </div>

      <h1>{{ t('order.confirmation.title') }}</h1>
      <p class="sub">{{ t('order.confirmation.subtitle') }}</p>

      <button class="order-number" @click="copyOrder">
        {{ orderNumber || '—' }}
        <Icon
          :icon="copied ? 'solar:check-circle-bold-duotone' : 'solar:copy-line-duotone'"
          width="16"
        />
      </button>
      <p v-if="copied" class="copied-hint">{{ t('order.confirmation.copied') }}</p>

      <div v-if="!loading && order?.total" class="order-total">
        {{ order?.paymentMethod === 'paypal' ? t('order.confirmation.totalPaid') : t('order.confirmation.totalDue') }}
        <strong>{{ Number(order.total).toFixed(2) }}€</strong>
      </div>

      <!-- Virement bancaire — coordonnées + référence réelle (le numéro de commande) -->
      <UiBankTransferCard
        v-if="!loading && order?.paymentMethod === 'bank_transfer' && bankDetails"
        class="bank-card-block"
        :beneficiary="bankDetails.accountHolder ?? ''"
        :iban="bankDetails.iban ?? ''"
        :bic="bankDetails.bic ?? undefined"
        :amount="Number(order.total)"
        :reference="orderNumber"
      />

      <!-- Retrait en magasin -->
      <div v-if="!loading && order?.paymentMethod === 'cash' && bankDetails?.pickupAddress" class="pickup-block">
        <div class="pickup-block-icon"><Icon icon="solar:map-point-line-duotone" width="18" /></div>
        <div class="pickup-block-text">
          <strong>{{ t('order.confirmation.pickupTitle') }}</strong>
          <span>{{ bankDetails.pickupAddress }}</span>
          <span v-if="bankDetails.pickupHours">{{ bankDetails.pickupHours }}</span>
        </div>
      </div>

      <div class="delivery-info">
        <Icon icon="solar:delivery-line-duotone" width="18" />
        <span>{{ t('order.confirmation.deliveryEstimate') }} <strong>{{ deliveryLabel }}</strong></span>
      </div>

      <div class="actions">
        <v-btn
          to="/shop"
          variant="tonal" rounded="pill" size="large"
        >{{ t('order.confirmation.continueShopping') }}</v-btn>
        <v-btn
          to="/order/tracking"
          color="primary" variant="flat" rounded="pill" size="large"
        >
          {{ t('order.confirmation.trackOrder') }}
          <Icon icon="solar:arrow-right-line-duotone" width="16" style="margin-left: 6px;" />
        </v-btn>
      </div>

    </div>
  </div>
</template>

<style scoped>
.confirmation-page {
  display: flex; align-items: center; justify-content: center;
  min-height: 0vh; padding: 42px 14px;
}
.confirmation-content { text-align: center; max-width: 380px; }

.check-icon { color: #4C7A4C; margin-bottom: 20px; }

h1 { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 600; margin-bottom: 8px; }
.sub { color: rgb(var(--v-theme-on-surface-variant)); font-size: 14px; margin-bottom: 24px; }

.order-number {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgb(var(--v-theme-surface-variant));
  border: none; cursor: pointer;
  padding: 12px 20px; border-radius: var(--r-lg);
  font-size: 15px; font-weight: 700; font-family: 'Fraunces', serif;
  color: rgb(var(--v-theme-on-surface));
  transition: background .2s;
  margin-bottom: 6px;
}
.order-number:hover { background: rgb(var(--v-theme-outline)); }
.copied-hint { font-size: 11.5px; color: #4C7A4C; margin-bottom: 16px; }

.order-total {
  font-size: 13.5px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 16px;
}
.order-total strong { color: rgb(var(--v-theme-secondary)); font-family: 'Fraunces', serif; }

.bank-card-block { text-align: left; margin-bottom: 20px; }

.pickup-block {
  display: flex; align-items: flex-start; gap: 12px; text-align: left;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-xl); padding: 16px; margin-bottom: 20px;
}
.pickup-block-icon {
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary));
}
.pickup-block-text { display: flex; flex-direction: column; gap: 2px; font-size: 12.5px; }
.pickup-block-text strong { font-size: 13.5px; margin-bottom: 2px; }
.pickup-block-text span { color: rgb(var(--v-theme-on-surface-variant)); }

.delivery-info {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 13.5px; color: rgb(var(--v-theme-on-surface-variant));
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg); padding: 14px; margin: 20px 0 28px;
}

.actions { display: flex; flex-direction: column; gap: 10px; }
</style>