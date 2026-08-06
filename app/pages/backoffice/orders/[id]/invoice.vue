<script setup lang="ts">
import { useAdminOrdersStore } from '~/stores/Models/ordersAdmin.store'
import { notify } from '~/@cores/constantes/helpers'
import type { OrderDetail } from '~/types/Models/order.type'
import { useAdminInvoiceStore } from '~/stores/Models/ invoiceadmin.store'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const ordersStore  = useAdminOrdersStore()
const invoiceStore = useAdminInvoiceStore()

const order          = ref<OrderDetail | null>(null)
const loading        = ref(true)
const orderNotFound  = ref(false)

// Plus de FALLBACK — un admin qui voit une facture doit voir la VRAIE,
// jamais une donnée silencieusement fausse si le chargement échoue.
async function loadAll() {
  loading.value       = true
  orderNotFound.value = false

  const orderId = route.params.id as string

  const orderData = await ordersStore.fetchOrderDetail(orderId)
  if (!orderData) {
    orderNotFound.value = true
    loading.value        = false
    return
  }
  order.value = orderData

  // notFound (facture pas encore générée) est géré dans invoiceStore —
  // pas de try/catch ici, le store expose déjà l'état.
  await invoiceStore.fetchForOrder(orderId)
  loading.value = false
}

onMounted(loadAll)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const PAYMENT_LABELS: Record<string, string> = {
  paypal: 'PayPal',
  bank_transfer: 'Virement bancaire',
  cash: 'Espèces',
}
const paymentLabel = computed(() => PAYMENT_LABELS[(order.value as any)?.paymentMethod ?? ''] ?? 'Non renseigné')

async function downloadInvoice() {
  const success = await invoiceStore.download()
  if (!success) {
    notify({ message: 'Impossible de télécharger la facture.', color: 'error', timeout: 4000 })
  }
}

async function sendViaWhatsapp() {
  if (!order.value) return

  const shareUrl = await invoiceStore.getShareLink()
  if (!shareUrl) {
    notify({ message: "Impossible de générer le lien de partage.", color: 'error', timeout: 4000 })
    return
  }

  const text = `Bonjour ${order.value.customerName}, voici votre facture ${invoiceStore.invoice?.invoiceNumber} : ${shareUrl}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[
      { label: 'Commandes', icon: 'solar:bag-4-line-duotone', to: '/backoffice/orders' },
      { label: order?.orderNumber ?? '...', to: order ? `/backoffice/orders/${order.id}` : undefined },
      { label: 'Facture' },
    ]">
      <div v-if="invoiceStore.invoice" class="header-actions">
        <v-btn variant="tonal" color="secondary" rounded="xl" :loading="invoiceStore.sharing" @click="sendViaWhatsapp">
          <Icon icon="solar:chat-round-line-duotone" width="16" style="margin-right: 6px;" />
          WhatsApp
        </v-btn>
        <v-btn color="secondary" variant="flat" rounded="xl" :loading="invoiceStore.downloading" @click="downloadInvoice">
          <Icon icon="solar:download-minimalistic-line-duotone" width="16" style="margin-right: 6px;" />
          Télécharger
        </v-btn>
      </div>
    </UiBreadCrumbs>

    <div v-if="loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <div v-else-if="orderNotFound" class="empty-block">
      <Icon icon="solar:bag-cross-line-duotone" width="40" />
      <p>Commande introuvable.</p>
      <v-btn variant="tonal" rounded="xl" to="/backoffice/orders">Retour aux commandes</v-btn>
    </div>

    <div v-else-if="invoiceStore.notFound" class="empty-block">
      <Icon icon="solar:document-text-line-duotone" width="40" />
      <p>Aucune facture générée pour cette commande.</p>
      <p class="empty-sub">La facture n'est créée qu'une fois le paiement confirmé — vérifie le statut de la commande.</p>
      <v-btn v-if="order" variant="tonal" rounded="xl" :to="`/backoffice/orders/${order.id}`">Voir la commande</v-btn>
    </div>

    <div v-else-if="invoiceStore.error" class="empty-block">
      <Icon icon="solar:danger-triangle-line-duotone" width="40" />
      <p>{{ invoiceStore.error }}</p>
      <v-btn variant="tonal" rounded="xl" @click="loadAll">Réessayer</v-btn>
    </div>

    <div v-else-if="invoiceStore.invoice && order" class="invoice-sheet">
      <div class="invoice">

        <!-- En-tête -->
        <div class="invoice-header">
          <div class="brand-block">
            <LayoutsLogo :show-text="true" :size="42" />
          </div>
          <div class="invoice-meta">
            <h1>Facture</h1>
            <p class="invoice-number">{{ invoiceStore.invoice.invoiceNumber }}</p>
            <p class="invoice-date">{{ formatDate(invoiceStore.invoice.issuedAt) }}</p>
          </div>
        </div>

        <!-- Facturé à / Livré à -->
        <div class="invoice-parties">
          <div>
            <div class="party-label">Facturé à</div>
            <div class="party-name">{{ order.customerName }}</div>
            <div class="party-detail">{{ order.customerEmail }}</div>
          </div>
          <div v-if="order.shippingAddress">
            <div class="party-label">Livré à</div>
            <div class="party-name">{{ order.shippingAddress.firstName }} {{ order.shippingAddress.lastName }}</div>
            <div class="party-detail">
              {{ order.shippingAddress.addressLine1 }}<br>
              {{ order.shippingAddress.postalCode }} {{ order.shippingAddress.city }}<br>
              {{ order.shippingAddress.countryCode }}
            </div>
          </div>
        </div>

        <!-- Articles — depuis la facture (snapshot figé), pas depuis la commande live -->
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Article</th>
              <th>Qté</th>
              <th class="text-right">Prix unit.</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in invoiceStore.invoice.items" :key="item.id">
              <td><div class="item-name">{{ item.description }}</div></td>
              <td>{{ item.quantity }}</td>
              <td class="text-right">{{ item.unitPrice.toFixed(2) }}€</td>
              <td class="text-right">{{ item.totalPrice.toFixed(2) }}€</td>
            </tr>
          </tbody>
        </table>

        <!-- Totaux -->
        <div class="invoice-totals">
          <div class="total-row">
            <span>Sous-total</span>
            <span>{{ invoiceStore.invoice.subtotal.toFixed(2) }}€</span>
          </div>
          <div v-if="invoiceStore.invoice.discountAmount > 0" class="total-row">
            <span>Remise</span>
            <span>-{{ invoiceStore.invoice.discountAmount.toFixed(2) }}€</span>
          </div>
          <div v-if="invoiceStore.invoice.taxAmount > 0" class="total-row">
            <span>TVA</span>
            <span>{{ invoiceStore.invoice.taxAmount.toFixed(2) }}€</span>
          </div>
          <div class="total-row grand">
            <span>Total</span>
            <span>{{ invoiceStore.invoice.total.toFixed(2) }}€</span>
          </div>
        </div>

        <!-- Pied -->
        <div class="invoice-footer">
          <p>Merci pour votre confiance.</p>
          <p class="footer-sub">Paiement traité via {{ paymentLabel }} · Retours acceptés sous 14 jours</p>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.header-actions { display: flex; gap: 8px; }

.loading-block, .empty-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 0;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
}
.empty-sub { font-size: 12.5px; max-width: 320px; }

.invoice-sheet {
  background: #FFFFFF;
  border-radius: var(--r-xl);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  padding: 40px;
  max-width: 720px;
  margin: 0 auto;
}

.invoice {
  font-family: 'Inter', sans-serif;
  color: #1A1210;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 24px;
  margin-bottom: 24px;
  border-bottom: 2px solid #1A1210;
}

.invoice-meta {
  text-align: right;
}

.invoice-meta h1 {
  font-family: 'Fraunces', serif;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.invoice-number {
  font-size: 13px;
  font-weight: 700;
  color: #C68A52;
}

.invoice-date {
  font-size: 12px;
  color: #6b6b6b;
  margin-top: 2px;
}

.invoice-parties {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.party-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #999;
  margin-bottom: 6px;
}

.party-name {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
}

.party-detail {
  font-size: 12px;
  color: #6b6b6b;
  line-height: 1.6;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.invoice-table th {
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #999;
  padding: 8px 6px;
  border-bottom: 1.5px solid #1A1210;
}

.invoice-table td {
  padding: 12px 6px;
  font-size: 12.5px;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}

.invoice-table .text-right {
  text-align: right;
}

.item-name {
  font-weight: 700;
}

.invoice-totals {
  margin-left: auto;
  width: 240px;
  margin-bottom: 40px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  padding: 5px 0;
  color: #6b6b6b;
}

.total-row span:last-child {
  font-weight: 600;
  color: #1A1210;
}

.total-row.grand {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
  border-top: 1.5px solid #1A1210;
  padding-top: 10px;
  margin-top: 6px;
  color: #1A1210;
}

.total-row.grand span:last-child {
  color: #C68A52;
}

.invoice-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.invoice-footer p {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
}

.footer-sub {
  font-size: 10.5px;
  color: #999;
  font-weight: 400 !important;
}

@media (max-width: 600px) {
  .invoice-header {
    flex-direction: column;
    gap: 16px;
  }

  .invoice-meta {
    text-align: left;
  }

  .invoice-parties {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .invoice-totals {
    width: 100%;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>