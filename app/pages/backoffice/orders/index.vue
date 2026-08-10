<script setup lang="ts">
import { useAdminOrdersStore } from '~/stores/Models/ordersAdmin.store'
import type { OrderListItem } from '~/types/Models/order.type'

definePageMeta({ layout: 'admin' })

const store = useAdminOrdersStore()
const search   = ref('')
const viewMode  = ref<'table' | 'cards'>('table')
const filterOpen = ref(false)
const filterStatus = ref<'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'>('all')
const currentPage = ref(1)
const totalPages   = ref(1)

const orders        = ref<OrderListItem[]>([])
const loadingOrders = ref(true)
const ordersError   = ref(false)

const STATUS_OPTIONS = [
  { title: 'Tous les statuts', value: 'all' },
  { title: 'En attente', value: 'pending' },
  { title: 'Confirmées', value: 'confirmed' },
  { title: 'Expédiées', value: 'shipped' },
  { title: 'Livrées', value: 'delivered' },
  { title: 'Annulées', value: 'cancelled' },
]

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

const STATUS_ICONS: Record<string, string> = {
  pending: 'solar:clock-circle-line-duotone',
  confirmed: 'solar:check-circle-line-duotone',
  shipped: 'solar:delivery-line-duotone',
  delivered: 'solar:home-2-line-duotone',
  cancelled: 'solar:close-circle-line-duotone',
}

const loadOrders = async () => {
  loadingOrders.value = true
  ordersError.value   = false

  const data = await store.fetchOrders({
    search: search.value || undefined,
    status: filterStatus.value !== 'all' ? filterStatus.value : undefined,
    page: currentPage.value,
    // "-" = ordre décroissant en convention JSON:API — le plus récent en
    // premier, plus pertinent qu'un tri par nom ou id par défaut pour
    // une liste de commandes qu'on consulte au quotidien.
    sort: '-createdAt',
  })

  orders.value     = data ?? []
  totalPages.value = store.pagination?.lastPage ?? 1

  if (store.error) {
    ordersError.value = true
  }

  loadingOrders.value = false
}

onMounted(loadOrders)
watch(search, () => {
  currentPage.value = 1
  loadOrders()
})
watch(currentPage, loadOrders)

const summary = computed(() => ({
  all:       orders.value.length,
  pending:   orders.value.filter(o => o.status === 'pending').length,
  shipped:   orders.value.filter(o => o.status === 'shipped').length,
  delivered: orders.value.filter(o => o.status === 'delivered').length,
}))

const SUMMARY_CARDS = [
  { key: 'all' as const,       label: 'Total commandes', icon: 'solar:bag-4-line-duotone',           color: 'secondary' },
  { key: 'pending' as const,   label: 'En attente',       icon: 'solar:clock-circle-line-duotone',    color: 'warning' },
  { key: 'shipped' as const,   label: 'Expédiées',        icon: 'solar:delivery-line-duotone',        color: 'info' },
  { key: 'delivered' as const, label: 'Livrées',          icon: 'solar:check-circle-line-duotone',    color: 'success' },
]

const filteredOrders = computed(() => orders.value)

function toggleQuickFilter(key: typeof filterStatus.value) {
  filterStatus.value  = filterStatus.value === key ? 'all' : key
  currentPage.value   = 1
  loadOrders()
}

function applyFilters() {
  filterOpen.value    = false
  currentPage.value   = 1
  loadOrders()
}

function resetFilters() {
  filterStatus.value  = 'all'
  filterOpen.value    = false
  currentPage.value   = 1
  loadOrders()
}

// Date + heure — plus utile qu'une simple date pour une liste consultée
// au quotidien (savoir "il y a combien de temps" compte autant que le jour).
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initials(name: string): string {
  if (!name || name === '—') return '?'
  return name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase()
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[{ label: 'Commandes', icon: 'solar:bag-4-line-duotone' }]" />

    <div class="summary-grid">
      <button
        v-for="card in SUMMARY_CARDS"
        :key="card.key"
        class="summary-card"
        :class="{ active: filterStatus === card.key }"
        @click="toggleQuickFilter(card.key)"
      >
        <v-sheet :color="card.color" rounded="xl" class="summary-icon" variant="tonal">
          <Icon :icon="card.icon" width="20" />
        </v-sheet>

        <div>
          <div class="summary-value">{{ summary[card.key] }}</div>
          <div class="summary-label">{{ card.label }}</div>
        </div>
      </button>
    </div>

    <div class="toolbar">
      <v-text-field
        v-model="search"
        variant="solo-filled"
        density="comfortable"
        flat
        hide-details
        rounded="xl"
        placeholder="Rechercher une commande, un client..."
        class="search-field"
      >
        <template #prepend-inner>
          <Icon icon="solar:magnifer-line-duotone" width="18" />
        </template>
      </v-text-field>

      <v-btn variant="tonal" color="secondary" rounded="xl" @click="filterOpen = true">
        <Icon icon="solar:tuning-2-line-duotone" width="18" style="margin-right: 6px;" />
        Filtrer
        <span v-if="filterStatus !== 'all'" class="filter-active-dot" />
      </v-btn>

      <v-btn-toggle
        v-model="viewMode"
        mandatory
        density="comfortable"
        color="secondary"
        rounded="xl"
        class="hide-mobile"
      >
        <v-btn value="table" size="small">
          <Icon icon="solar:list-line-duotone" width="18" />
        </v-btn>
        <v-btn value="cards" size="small">
          <Icon icon="solar:widget-2-line-duotone" width="18" />
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- Chargement -->
    <div v-if="loadingOrders" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <!-- Erreur réseau réelle -->
    <div v-else-if="ordersError" class="empty-block">
      <Icon icon="solar:cloud-cross-line-duotone" width="36" />
      <p>Impossible de charger les commandes.</p>
      <v-btn variant="tonal" rounded="xl" size="small" @click="loadOrders()">Réessayer</v-btn>
    </div>

    <!-- Aucune commande -->
    <div v-else-if="filteredOrders.length === 0" class="empty-block">
      <Icon icon="solar:bag-cross-line-duotone" width="36" />
      <p>Aucune commande trouvée.</p>
    </div>

    <!-- Table premium : desktop uniquement -->
    <div v-else-if="viewMode === 'table'" class="orders-table hide-mobile">
      <table>
        <thead>
          <tr>
            <th>Commande</th>
            <th>Client</th>
            <th>Date</th>
            <th>Statut</th>
            <th class="text-right">Montant</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in filteredOrders" :key="o.id" class="order-row" :class="`accent-${o.status}`">
            <td class="order-id-cell">
              <NuxtLink :to="`/backoffice/orders/${o.id}`" class="order-id-link">{{ o.orderNumber }}</NuxtLink>
            </td>
            <td>
              <div class="customer-cell">
                <div class="customer-avatar">{{ initials(o.customerName) }}</div>
                <div>
                  <div class="customer-name">{{ o.customerName }}</div>
                  <div class="muted">{{ o.customerEmail }}</div>
                </div>
              </div>
            </td>
            <td class="muted">{{ formatDate(o.createdAt) }}</td>
            <td>
              <span class="status-badge" :class="o.status">
                <Icon :icon="STATUS_ICONS[o.status]" width="12" />
                {{ STATUS_LABELS[o.status] }}
              </span>
            </td>
            <td class="text-right amount">{{ o.total.toFixed(2) }}€</td>
            <td class="text-right">
              <v-btn icon variant="tonal" color="secondary" size="34" :to="`/backoffice/orders/${o.id}`">
                <Icon icon="solar:arrow-right-line-duotone" width="16" />
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cards premium -->
    <div
      v-if="!loadingOrders && !ordersError && filteredOrders.length > 0"
      class="orders-cards"
      :class="{ 'cards-hidden-desktop': viewMode === 'table' }"
    >
      <NuxtLink
        v-for="o in filteredOrders"
        :key="o.id"
        :to="`/backoffice/orders/${o.id}`"
        class="order-card"
        :class="`accent-${o.status}`"
      >
        <div class="order-card-top">
          <div class="customer-cell">
            <div class="customer-avatar">{{ initials(o.customerName) }}</div>
            <div>
              <div class="customer-name">{{ o.customerName }}</div>
              <div class="muted">{{ formatDate(o.createdAt) }}</div>
            </div>
          </div>
          <span class="status-badge" :class="o.status">
            <Icon :icon="STATUS_ICONS[o.status]" width="12" />
            {{ STATUS_LABELS[o.status] }}
          </span>
        </div>

        <div class="order-card-bottom">
          <span class="order-id">{{ o.orderNumber }}</span>
          <span class="amount">{{ o.total.toFixed(2) }}€</span>
        </div>
      </NuxtLink>
    </div>

    <!-- Pagination -->
    <div
      v-if="!loadingOrders && !ordersError && filteredOrders.length > 0 && totalPages > 1"
      class="pagination-wrap"
    >
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="5"
        density="comfortable"
        rounded="circle"
        color="secondary"
      />
    </div>

    <!-- Offcanvas filtres -->
    <v-navigation-drawer v-model="filterOpen" temporary location="right" width="320">
      <div class="filter-drawer">
        <div class="filter-head">
          <h3>Filtrer</h3>
          <v-btn icon color="error" variant="text" size="36" @click="filterOpen = false">
            <Icon icon="solar:close-circle-line-duotone" width="22" />
          </v-btn>
        </div>

        <div class="filter-body">
          <label class="filter-label">Statut</label>
          <v-select
            v-model="filterStatus"
            :items="STATUS_OPTIONS"
            variant="solo-filled"
            flat
            rounded="xl"
            density="comfortable"
            class="mb-4"
          />
        </div>

        <div class="filter-foot mx-auto">
          <v-btn variant="tonal" color="primary" rounded="xl"  @click="resetFilters">
            Réinitialiser
          </v-btn>
          <v-btn color="secondary" variant="flat" rounded="xl"  @click="applyFilters">
            Appliquer
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>

  </div>
</template>

<style scoped>
.hide-mobile {
  display: none;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 18px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgb(var(--v-theme-surface));
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-lg);
  padding: 12px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
}

.summary-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
}

.summary-card.active {
  border-color: rgb(var(--v-theme-secondary));
  box-shadow: 0 4px 14px rgba(var(--v-theme-secondary), 0.15);
}

.summary-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-value {
  font-family: 'Fraunces', serif;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.1;
}

.summary-label {
  font-size: 10.5px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-weight: 600;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.search-field {
  flex: 1;
}

.filter-active-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgb(var(--v-theme-secondary));
  margin-left: 6px;
}

.loading-block,
.empty-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 0;
  color: rgb(var(--v-theme-on-surface-variant));
}

.customer-cell { display: flex; align-items: center; gap: 10px; }
.customer-avatar {
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  background: rgb(var(--v-theme-secondary)); color: rgb(var(--v-theme-on-primary));
  display: flex; align-items: center; justify-content: center;
  font-family: 'Fraunces', serif; font-size: 12px; font-weight: 700;
}
.customer-name { font-size: 13px; font-weight: 700; margin-bottom: 1px; }

.orders-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-left: 3px solid transparent;
  border-radius: var(--r-lg);
  padding: 14px 16px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s, box-shadow 0.2s;
}
.order-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}
.order-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.order-card-bottom {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 10px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.order-id {
  font-size: 12px;
  font-weight: 700;
  color: rgb(var(--v-theme-secondary));
}

.order-id-cell { white-space: nowrap; }
.order-id-link {
  font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-secondary));
  text-decoration: none;
}
.order-id-link:hover { text-decoration: underline; }

.muted {
  font-size: 11.5px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.amount {
  font-family: 'Fraunces', serif;
  font-size: 14px;
  font-weight: 700;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--r-full);
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.status-badge.pending {
  background: rgba(217, 164, 65, 0.15);
  color: #B8862F;
}

.status-badge.confirmed {
  background: rgba(198, 138, 82, 0.15);
  color: #C68A52;
}

.status-badge.shipped {
  background: rgba(110, 143, 184, 0.15);
  color: #6E8FB8;
}

.status-badge.delivered {
  background: rgba(76, 122, 76, 0.12);
  color: #4C7A4C;
}

.status-badge.cancelled {
  background: rgba(192, 83, 62, 0.12);
  color: #C0533E;
}

.accent-pending   { border-left-color: #D9A441; }
.accent-confirmed { border-left-color: #C68A52; }
.accent-shipped   { border-left-color: #6E8FB8; }
.accent-delivered { border-left-color: #4C7A4C; }
.accent-cancelled { border-left-color: #C0533E; }

.filter-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.filter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.filter-head h3 {
  font-family: 'Fraunces', serif;
  font-size: 17px;
  font-weight: 700;
}

.filter-body {
  flex: 1;
}

.filter-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 8px;
}

.filter-foot {
  display: flex;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (min-width: 960px) {
  .hide-mobile {
    display: flex;
  }

  .orders-cards.cards-hidden-desktop {
    display: none;
  }

  .summary-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .summary-card {
    padding: 16px;
  }

  .summary-icon {
    width: 42px;
    height: 42px;
  }

  .summary-value {
    font-size: 22px;
  }

  .orders-table {
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
    border-radius: var(--r-xl);
    overflow: hidden;
  }

  .orders-table table {
    width: 100%;
    border-collapse: collapse;
  }

  .orders-table th {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: rgb(var(--v-theme-on-surface-variant));
    padding: 14px 18px;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  }

  .orders-table td {
    padding: 14px 18px;
    font-size: 13px;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  }

  .order-row {
    border-left: 3px solid transparent;
    transition: background 0.15s;
  }
  .order-row:hover {
    background: rgba(var(--v-theme-on-surface), 0.015);
  }

  .orders-table tr:last-child td {
    border-bottom: none;
  }

  .orders-table .text-right {
    text-align: right;
  }
}
</style>