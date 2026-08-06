<script setup lang="ts">
import { useAdminOrdersStore } from '~/stores/Models/ordersAdmin.store'
import { notify } from '~/@cores/constantes/helpers'
import type { OrderDetail } from '~/types/Models/order.type'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const store = useAdminOrdersStore()

const order    = ref<OrderDetail | null>(null)
const loading  = ref(true)
const notFound = ref(false)

const loadOrder = async () => {
  loading.value  = true
  notFound.value = false

  const data = await store.fetchOrderDetail(route.params.id as string)

  if (!data) {
    notFound.value = true
  } else {
    order.value = data
  }

  loading.value = false
}
onMounted(loadOrder)

const STATUS_STEPS = [
  { key: 'pending',   label: 'En attente',  icon: 'solar:bill-list-line-duotone' },
  { key: 'confirmed', label: 'Confirmée',    icon: 'solar:check-circle-line-duotone' },
  { key: 'shipped',   label: 'Expédiée',      icon: 'solar:delivery-line-duotone' },
  { key: 'delivered', label: 'Livrée',        icon: 'solar:home-2-line-duotone' },
]
const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée',
}

const PAYMENT_META: Record<string, { label: string; icon: string }> = {
  paypal:         { label: 'PayPal',            icon: 'solar:card-line-duotone' },
  bank_transfer:  { label: 'Virement bancaire', icon: 'solar:banknote-2-line-duotone' },
  cash:           { label: 'Espèces',           icon: 'solar:wallet-money-line-duotone' },
}

const paymentMeta = computed(() =>
  order.value ? PAYMENT_META[order.value.paymentMethod] ?? { label: order.value.paymentMethod, icon: 'solar:card-line-duotone' } : null
)

// Le paiement manuel (virement/espèces) doit être vérifié par l'admin avant
// de pouvoir avancer la commande — PayPal se confirme tout seul via webhook,
// donc jamais ce bouton pour ce moyen de paiement.
const needsManualPaymentConfirmation = computed(() =>
  order.value?.status === 'pending' &&
  ['bank_transfer', 'cash'].includes(order.value?.paymentMethod ?? '') &&
  !order.value?.paidAt
)

const currentStepIndex = computed(() => {
  if (!order.value) return 0
  const idx = STATUS_STEPS.findIndex(s => s.key === order.value!.status)
  return idx === -1 ? 0 : idx
})
const isCancelled = computed(() => order.value?.status === 'cancelled')

// ── Actions
const shipDialog      = ref(false)
const markAsPaidDialog = ref(false)
const cancelDialog    = ref(false)
const cancelReason    = ref('')

async function onConfirm() {
  if (!order.value) return
  const success = await store.confirmOrder(order.value.id)
  if (success && store.currentOrder) order.value = store.currentOrder
  notify({
    message: success ? 'Commande confirmée.' : (store.error ?? 'Impossible de confirmer la commande.'),
    color: success ? 'success' : 'error',
    timeout: 3500,
  })
}

async function onShipConfirm(payload: { carrierCode: string | null; trackingNumber: string | null }) {
  if (!order.value) return
  const success = await store.shipOrder(order.value.id, payload.carrierCode, payload.trackingNumber)
  if (success && store.currentOrder) order.value = store.currentOrder
  notify({
    message: success ? 'Commande marquée comme expédiée.' : (store.error ?? "Impossible de marquer la commande comme expédiée."),
    color: success ? 'success' : 'error',
    timeout: 3500,
  })
}

async function onMarkAsPaidConfirm(payload: { note: string }) {
  if (!order.value) return
  const success = await store.markAsPaidOrder(order.value.id, payload.note)
  if (success && store.currentOrder) order.value = store.currentOrder
  notify({
    message: success ? 'Paiement confirmé.' : (store.error ?? 'Impossible de marquer la commande comme payée — vérifie que le paiement n\'a pas déjà été enregistré.'),
    color: success ? 'success' : 'error',
    timeout: 4000,
  })
}

async function onDeliver() {
  if (!order.value) return
  const success = await store.deliverOrder(order.value.id)
  if (success && store.currentOrder) order.value = store.currentOrder
  notify({
    message: success ? 'Commande marquée comme livrée.' : (store.error ?? 'Impossible de marquer la commande comme livrée.'),
    color: success ? 'success' : 'error',
    timeout: 3500,
  })
}
async function onCancel() {
  if (!order.value) return
  const success = await store.cancelOrder(order.value.id, cancelReason.value || undefined)
  if (success && store.currentOrder) order.value = store.currentOrder
  cancelDialog.value = false
  cancelReason.value = ''
  notify({
    message: success ? 'Commande annulée.' : (store.error ?? "Impossible d'annuler la commande."),
    color: success ? 'success' : 'error',
    timeout: 3500,
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase()
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[
      { label: 'Commandes', icon: 'solar:bag-4-line-duotone', to: '/backoffice/orders' },
      { label: order?.orderNumber ?? '...' },
    ]">
      <v-btn
        v-if="order"
        variant="tonal" color="secondary" rounded="xl"
        :to="`/backoffice/orders/${order.id}/invoice`"
      >
        <Icon icon="solar:document-text-line-duotone" width="18" style="margin-right: 6px;" />
        Facture
      </v-btn>
    </UiBreadCrumbs>

    <!-- Chargement -->
    <div v-if="loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <!-- Introuvable -->
    <div v-else-if="notFound" class="not-found-block">
      <Icon icon="solar:bag-cross-line-duotone" width="40" />
      <p>Commande introuvable.</p>
      <v-btn variant="tonal" rounded="xl" to="/backoffice/orders">Retour aux commandes</v-btn>
    </div>

    <template v-else-if="order">

      <!-- Alerte paiement manuel à vérifier -->
      <div v-if="needsManualPaymentConfirmation" class="pending-payment-banner">
        <Icon icon="solar:danger-triangle-line-duotone" width="18" />
        <div class="pending-payment-text">
          <strong>Paiement à vérifier manuellement</strong>
          <span>{{ paymentMeta?.label }} — la commande reste en attente tant que le paiement n'est pas confirmé.</span>
        </div>
        <v-btn size="small" color="secondary" variant="flat" rounded="xl" @click="markAsPaidDialog = true">
          Marquer comme payée
        </v-btn>
      </div>

      <!-- Timeline statut -->
      <div class="panel status-panel">
        <div v-if="isCancelled" class="cancelled-banner">
          <Icon icon="solar:close-circle-bold-duotone" width="20" />
          Cette commande a été annulée.
        </div>

        <div v-else class="status-timeline">
          <div
            v-for="(step, i) in STATUS_STEPS" :key="step.key"
            class="status-step" :class="{ done: i <= currentStepIndex, active: i === currentStepIndex }"
          >
            <div class="status-dot"><Icon :icon="step.icon" width="16" /></div>
            <span class="status-label">{{ step.label }}</span>
            <div v-if="i < STATUS_STEPS.length - 1" class="status-connector" :class="{ done: i < currentStepIndex }" />
          </div>
        </div>

        <div v-if="!isCancelled" class="status-actions">
          <v-btn
            v-if="order.status === 'pending' && !needsManualPaymentConfirmation"
            color="secondary" variant="flat" rounded="xl" :loading="store.actionLoading" @click="onConfirm"
          >
            <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
            Confirmer la commande
          </v-btn>
          <v-btn v-if="order.status === 'confirmed'" color="secondary" variant="flat" rounded="xl" @click="shipDialog = true">
            <Icon icon="solar:delivery-line-duotone" width="16" style="margin-right: 6px;" />
            Marquer comme expédiée
          </v-btn>
          <v-btn v-if="order.status === 'shipped'" color="secondary" variant="flat" rounded="xl" :loading="store.actionLoading" @click="onDeliver">
            <Icon icon="solar:home-2-line-duotone" width="16" style="margin-right: 6px;" />
            Marquer comme livrée
          </v-btn>
          <v-btn v-if="['pending', 'confirmed'].includes(order.status)" variant="tonal" color="error" rounded="xl" @click="cancelDialog = true">
            <Icon icon="solar:close-circle-line-duotone" width="16" style="margin-right: 6px;" />
            Annuler
          </v-btn>
        </div>
      </div>

      <div class="detail-grid">

        <!-- Colonne principale -->
        <div class="main-col">

          <div class="panel">
            <h2>Articles</h2>
            <div class="items-list">
              <div v-for="item in order.items" :key="item.id" class="item-row">
                <div class="item-info">
                  <div class="item-name">{{ item.productName }}</div>
                  <div class="muted">{{ item.variantName }} · {{ item.sku }} · ×{{ item.quantity }}</div>
                </div>
                <div class="amount">{{ item.totalPrice.toFixed(2) }}€</div>
              </div>
            </div>

            <div class="totals">
              <div class="total-row"><span>Sous-total</span><span>{{ order.subtotal.toFixed(2) }}€</span></div>
              <div class="total-row"><span>Livraison</span><span>{{ order.shippingAmount === 0 ? 'Gratuite' : `${order.shippingAmount.toFixed(2)}€` }}</span></div>
              <div v-if="order.discountAmount > 0" class="total-row"><span>Remise</span><span>-{{ order.discountAmount.toFixed(2) }}€</span></div>
              <div class="total-row grand"><span>Total</span><span>{{ order.total.toFixed(2) }}€</span></div>
            </div>
          </div>

          <div class="panel">
            <h2>Historique</h2>
            <div v-if="order.statusHistories.length" class="history-list">
              <div v-for="(h, i) in order.statusHistories" :key="i" class="history-item">
                <div class="history-dot" />
                <div class="history-info">
                  <div class="history-status">{{ STATUS_LABELS[h.status] ?? h.status }}</div>
                  <div v-if="h.note" class="muted">{{ h.note }}</div>
                  <div class="history-date">{{ formatDate(h.createdAt) }}</div>
                </div>
              </div>
            </div>
            <p v-else class="muted">Aucun historique disponible.</p>
          </div>

        </div>

        <!-- Colonne latérale -->
        <div class="side-col">

          <div class="panel">
            <h2>Client</h2>
            <div class="customer-block">
              <div class="customer-avatar">{{ initials(order.customerName) }}</div>
              <div>
                <div class="customer-name">{{ order.customerName }}</div>
                <div class="muted">{{ order.customerEmail }}</div>
              </div>
            </div>
          </div>

          <div v-if="paymentMeta" class="panel">
            <h2>Paiement</h2>
            <div class="payment-badge">
              <Icon :icon="paymentMeta.icon" width="18" />
              <span>{{ paymentMeta.label }}</span>
              <v-chip
                size="x-small" variant="tonal"
                :color="needsManualPaymentConfirmation ? 'warning' : 'success'"
                class="ml-auto"
              >
                {{ needsManualPaymentConfirmation ? 'À vérifier' : 'Payé' }}
              </v-chip>
            </div>

            <div v-if="order.transaction" class="transaction-details">
              <div class="transaction-row">
                <span class="transaction-label">Montant</span>
                <span class="transaction-value">{{ order.transaction.amount.toFixed(2) }}€</span>
              </div>
              <div class="transaction-row">
                <span class="transaction-label">Statut transaction</span>
                <span class="transaction-value" :class="`status-${order.transaction.status}`">
                  {{ order.transaction.status === 'paid' ? 'Payée' : order.transaction.status === 'pending' ? 'En attente' : 'Échouée' }}
                </span>
              </div>
              <div v-if="order.transaction.providerTransactionId" class="transaction-row">
                <span class="transaction-label">Réf. {{ order.transaction.provider === 'paypal' ? 'PayPal' : 'transaction' }}</span>
                <span class="transaction-value mono">{{ order.transaction.providerTransactionId }}</span>
              </div>
              <div class="transaction-row">
                <span class="transaction-label">Créée le</span>
                <span class="transaction-value">{{ formatDate(order.transaction.createdAt) }}</span>
              </div>
            </div>
            <div v-else-if="!needsManualPaymentConfirmation" class="payment-transaction-row muted">
              <Icon icon="solar:danger-triangle-line-duotone" width="14" />
              <span>Aucune transaction liée — vérifie latest_transaction_id sur la commande.</span>
            </div>

            <div v-if="order.paidAt" class="payment-transaction-row">
              <Icon icon="solar:check-circle-line-duotone" width="14" />
              <span>Reçu le {{ formatDate(order.paidAt) }}</span>
            </div>
          </div>

          <div v-if="order.shippingAddress" class="panel">
            <h2>Adresse de livraison</h2>
            <p class="address-text">
              {{ order.shippingAddress.firstName }} {{ order.shippingAddress.lastName }}<br>
              {{ order.shippingAddress.addressLine1 }}<br>
              {{ order.shippingAddress.postalCode }} {{ order.shippingAddress.city }}<br>
              {{ order.shippingAddress.countryCode }}
            </p>
          </div>

          <div v-if="order.trackingNumber || order.shippingMethodName" class="panel">
            <h2>Livraison</h2>
            <div v-if="order.shippingMethodName" class="info-row">
              <Icon icon="solar:delivery-line-duotone" width="16" />{{ order.shippingMethodName }}
            </div>
            <div v-if="order.trackingNumber" class="info-row">
              <Icon icon="solar:box-line-duotone" width="16" />{{ order.trackingNumber }}
            </div>
          </div>

        </div>

      </div>

    </template>

    <!-- Dialogs -->
    <DialogMarkasShipped
      v-if="order"
      v-model="shipDialog"
      :order-number="order.orderNumber"
      :is-pickup="order.isPickup"
      @confirm="onShipConfirm"
    />

    <DialogMarksPaid
      v-if="order && paymentMeta"
      v-model="markAsPaidDialog"
      :order-number="order.orderNumber"
      :payment-method="order.paymentMethod as 'cash' | 'bank_transfer'"
      :amount="order.total"
      @confirm="onMarkAsPaidConfirm"
    />

    <!-- Dialog annulation -->
    <v-dialog v-model="cancelDialog" max-width="380">
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="text-body-1 font-weight-bold">Annuler cette commande ?</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="cancelReason" label="Motif (optionnel)" rows="2" variant="solo-filled" flat rounded="xl" density="comfortable" hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelDialog = false">Retour</v-btn>
          <v-btn color="error" variant="flat" rounded="xl" :loading="store.actionLoading" @click="onCancel">Confirmer l'annulation</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<style scoped>
.hide-mobile-text { display: none; }
@media (min-width: 600px) {
  .hide-mobile-text { display: inline; }
}

.loading-block,
.not-found-block {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 60px 0; color: rgb(var(--v-theme-on-surface-variant));
}

.pending-payment-banner {
  display: flex; align-items: center; gap: 12px;
  background: rgba(var(--v-theme-warning), 0.1);
  border: 1px solid rgba(var(--v-theme-warning), 0.25);
  border-radius: var(--r-xl); padding: 14px 16px; margin-bottom: 16px;
  color: rgb(var(--v-theme-on-surface));
}
.pending-payment-banner > .iconify { flex-shrink: 0; color: rgb(var(--v-theme-warning)); }
.pending-payment-text { display: flex; flex-direction: column; gap: 2px; flex: 1; font-size: 12.5px; }
.pending-payment-text strong { font-size: 13px; }
.pending-payment-text span { color: rgb(var(--v-theme-on-surface-variant)); }

.panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 20px; margin-bottom: 16px;
}
.panel h2 { font-size: 14px; font-weight: 700; margin-bottom: 14px; }

.cancelled-banner {
  display: flex; align-items: center; gap: 8px;
  background: rgba(192, 83, 62, 0.1); color: #C0533E;
  border-radius: var(--r-lg); padding: 12px; font-size: 13px; font-weight: 700;
}

.status-timeline { display: flex; justify-content: space-between; margin-bottom: 20px; position: relative; }
.status-step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; position: relative; }
.status-dot {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgb(var(--v-theme-surface-variant)); color: rgb(var(--v-theme-on-surface-variant));
  display: flex; align-items: center; justify-content: center; z-index: 1;
  transition: background .2s, color .2s;
}
.status-step.done .status-dot { background: #4C7A4C; color: #FAFAF8; }
.status-step.active .status-dot { background: rgb(var(--v-theme-secondary)); color: rgb(var(--v-theme-on-primary)); transform: scale(1.1); }
.status-label { font-size: 9.5px; font-weight: 700; color: rgb(var(--v-theme-on-surface-variant)); text-align: center; }
.status-connector { position: absolute; top: 17px; left: 50%; width: 100%; height: 2px; background: rgb(var(--v-theme-outline)); z-index: 0; }
.status-connector.done { background: #4C7A4C; }

.status-actions { display: flex; flex-wrap: wrap; gap: 10px; padding-top: 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }

.detail-grid { display: flex; flex-direction: column; gap: 0; }
.main-col, .side-col { display: flex; flex-direction: column; }

.items-list { margin-bottom: 4px; }
.item-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.item-row:last-child { border-bottom: none; }
.item-name { font-size: 13px; font-weight: 700; }
.muted { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); }
.amount { font-size: 13px; font-weight: 700; }

.totals { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.total-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 4px 0; color: rgb(var(--v-theme-on-surface-variant)); }
.total-row span:last-child { font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.total-row.grand { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; margin-top: 6px; padding-top: 10px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08); color: rgb(var(--v-theme-on-surface)); }
.total-row.grand span:last-child { color: rgb(var(--v-theme-secondary)); }

.history-list { display: flex; flex-direction: column; gap: 14px; }
.history-item { display: flex; gap: 10px; align-items: flex-start; }
.history-dot { width: 8px; height: 8px; border-radius: 50%; background: rgb(var(--v-theme-secondary)); margin-top: 5px; flex-shrink: 0; }
.history-status { font-size: 13px; font-weight: 700; }
.history-date { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }

.customer-block { display: flex; align-items: center; gap: 12px; }
.customer-avatar {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: rgb(var(--v-theme-secondary)); color: rgb(var(--v-theme-on-primary));
  display: flex; align-items: center; justify-content: center;
  font-family: 'Fraunces', serif; font-size: 14px; font-weight: 700;
}
.customer-name { font-size: 13.5px; font-weight: 700; margin-bottom: 2px; }

.payment-badge {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 700;
}
.payment-badge > .iconify { color: rgb(var(--v-theme-secondary)); }

.payment-transaction-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 11.5px; font-weight: 600;
  color: #4C7A4C; margin-top: 10px;
}
.payment-transaction-row.muted { color: #C0533E; }

.transaction-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.transaction-row { display: flex; justify-content: space-between; font-size: 12px; }
.transaction-label { color: rgb(var(--v-theme-on-surface-variant)); }
.transaction-value { font-weight: 700; }
.transaction-value.mono { font-family: monospace; font-size: 11px; }
.transaction-value.status-paid { color: #4C7A4C; }
.transaction-value.status-pending { color: #B8862F; }
.transaction-value.status-failed { color: #C0533E; }

.info-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; margin-bottom: 8px; }
.info-row:last-child { margin-bottom: 0; }
.address-text { font-size: 12.5px; line-height: 1.6; color: rgb(var(--v-theme-on-surface-variant)); }

@media (min-width: 960px) {
  .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }
}
</style>