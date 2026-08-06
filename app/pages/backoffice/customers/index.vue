<script setup lang="ts">
import { useAdminCustomersStore } from '~/stores/Models/customersAdmin.store'
import type { CustomerListItem } from '~/types/Models/customer.type'

definePageMeta({ layout: 'admin' })

const store = useAdminCustomersStore()

const search      = ref('')
const viewMode    = ref<'table' | 'cards'>('cards')
const currentPage = ref(1)

const FALLBACK_CUSTOMERS: CustomerListItem[] = [
  {
    id: 'fb-1', firstName: 'Marie', lastName: 'Dubois', email: 'marie.dubois@example.com',
    phone: '+33 6 12 34 56 78', status: 'active', ordersCount: 4, totalSpent: 1284.60,
    lastOrderAt: '2026-07-08T14:32:00Z', createdAt: '2026-03-02T09:00:00Z',
  },
  {
    id: 'fb-2', firstName: 'Fatou', lastName: 'Diallo', email: 'fatou.diallo@example.com',
    phone: null, status: 'active', ordersCount: 1, totalSpent: 285.00,
    lastOrderAt: '2026-07-09T09:10:00Z', createdAt: '2026-07-09T09:10:00Z',
  },
]

const customers      = ref<CustomerListItem[]>([])
const totalPages     = ref(1)
const usingFallback  = ref(false)

const loadCustomers = async () => {
  const data = await store.fetchCustomers({
    search: search.value || undefined,
    page: currentPage.value,
  })

  if (data.length) {
    customers.value     = data
    totalPages.value    = store.pagination?.lastPage ?? 1
    usingFallback.value = false
  }
  else {
    // customers.value     = FALLBACK_CUSTOMERS
    // totalPages.value    = 1
    usingFallback.value = true
  }
}

onMounted(loadCustomers)
watch(search, () => {
  currentPage.value = 1
  loadCustomers()
})
watch(currentPage, loadCustomers)

// Palette premium — couleur déterministe par client, stable entre les rendus
const AVATAR_RAMPS = ['secondary', 'info', 'success', 'warning', 'error'] as const

function avatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_RAMPS[Math.abs(hash) % AVATAR_RAMPS.length]
}

function initials(c: CustomerListItem) {
  return `${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase()
}

function formatDate(iso: string | null) {
  if (!iso) return 'Jamais commandé'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  suspended: 'Suspendu',
}

// Segmentation rapide côté client — VIP = client à forte valeur, purement indicatif visuel
function isVip(c: CustomerListItem) {
  return c.totalSpent >= 800
}
</script>

<template>
  <div>


    

    <UiBreadCrumbs :items="[{ label: 'Clients', icon: 'solar:users-group-rounded-line-duotone' }]" />

    <div v-if="usingFallback" class="fallback-banner">
      <Icon icon="solar:info-circle-line-duotone" width="16" />
      Aucun client réel pour le moment — aperçu avec des données d'exemple.
    </div>

    <div class="toolbar">
      <v-text-field
        v-model="search"
        variant="solo-filled"
        density="comfortable"
        flat
        hide-details
        rounded="xl"
        placeholder="Rechercher un client, un email..."
        class="search-field"
      >
        <template #prepend-inner>
          <Icon icon="solar:magnifer-line-duotone" width="18" />
        </template>
      </v-text-field>

      <v-btn-toggle v-model="viewMode" mandatory density="comfortable" color="secondary" rounded="xl" class="hide-mobile">
        <v-btn value="table" size="small">
          <Icon icon="solar:list-line-duotone" width="18" />
        </v-btn>
        <v-btn value="cards" size="small">
          <Icon icon="solar:widget-2-line-duotone" width="18" />
        </v-btn>
      </v-btn-toggle>
    </div>

    <div v-if="store.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <!-- Table -->
    <div v-else-if="viewMode === 'table'" class="data-table hide-mobile">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Contact</th>
            <th class="text-right">Commandes</th>
            <th class="text-right">Total dépensé</th>
            <th>Dernière commande</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in customers" :key="c.id">
            <td>
              <div class="row-customer">
                <div class="avatar" :class="`bg-${avatarColor(c.id)}`">{{ initials(c) }}</div>
                <div>
                  <div class="customer-name">
                    {{ c.firstName }} {{ c.lastName }}
                    <Icon v-if="isVip(c)" icon="solar:crown-line-duotone" width="13" class="vip-icon" />
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div>{{ c.email }}</div>
              <div class="muted">{{ c.phone ?? '—' }}</div>
            </td>
            <td class="text-right">{{ c.ordersCount }}</td>
            <td class="text-right amount">{{ c.totalSpent.toFixed(2) }}€</td>
            <td class="muted">{{ formatDate(c.lastOrderAt) }}</td>
            <td class="text-right">
              <v-btn icon variant="text" size="36" :to="`/backoffice/customers/${c.id}`">
                <Icon icon="solar:eye-line-duotone" width="17" />
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cards premium -->
    <div v-else class="customer-cards">
      <NuxtLink v-for="c in customers" :key="c.id" :to="`/backoffice/customers/${c.id}`" class="customer-card">
        <div v-if="isVip(c)" class="vip-ribbon">
          <Icon icon="solar:crown-bold-duotone" width="12" />
          VIP
        </div>

        <div class="card-top">
          <div class="avatar avatar-lg" :class="`bg-${avatarColor(c.id)}`">{{ initials(c) }}</div>
          <div class="card-identity">
            <div class="customer-name">{{ c.firstName }} {{ c.lastName }}</div>
            <div class="muted email-clip">{{ c.email }}</div>
            <span class="status-badge" :class="c.status">{{ STATUS_LABELS[c.status] ?? c.status }}</span>
          </div>
        </div>

        <div class="card-stats">
          <div class="stat">
            <div class="stat-value">{{ c.ordersCount }}</div>
            <div class="stat-label">Commande{{ c.ordersCount > 1 ? 's' : '' }}</div>
          </div>
          <div class="stat-divider" />
          <div class="stat">
            <div class="stat-value amount">{{ c.totalSpent.toFixed(2) }}€</div>
            <div class="stat-label">Total dépensé</div>
          </div>
        </div>

        <div class="card-footer">
          <Icon icon="solar:clock-circle-line-duotone" width="13" />
          {{ formatDate(c.lastOrderAt) }}
        </div>
      </NuxtLink>
    </div>

    <UiPagination v-if="!usingFallback" v-model="currentPage" :total-pages="totalPages" />

  </div>
</template>

<style scoped>
.hide-mobile { display: none; }

.fallback-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(var(--v-theme-secondary), 0.08);
  color: rgb(var(--v-theme-secondary));
  border-radius: var(--r-lg);
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 14px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.search-field { flex: 1; }

.loading-block {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #FAFAF8;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.avatar-lg { width: 52px; height: 52px; font-size: 16px; }

.bg-secondary { background: rgb(var(--v-theme-secondary)); }
.bg-info      { background: #6E8FB8; }
.bg-success   { background: #4C7A4C; }
.bg-warning   { background: #B8862F; }
.bg-error     { background: #C0533E; }

.muted { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); }
.amount { color: rgb(var(--v-theme-secondary)); }

.vip-icon { color: #B8862F; margin-left: 4px; vertical-align: middle; }

.status-badge {
  display: inline-flex;
  margin-top: 6px;
  padding: 2px 9px;
  border-radius: var(--r-full);
  font-size: 9.5px;
  font-weight: 700;
}
.status-badge.active    { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.status-badge.inactive  { background: rgba(var(--v-theme-on-surface), 0.08); color: rgb(var(--v-theme-on-surface-variant)); }
.status-badge.suspended { background: rgba(192, 83, 62, 0.12); color: #C0533E; }

.customer-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
.customer-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl);
  padding: 18px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.customer-card:hover {
  border-color: rgb(var(--v-theme-secondary));
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.vip-ribbon {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(184, 134, 47, 0.12);
  color: #B8862F;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 3px 9px;
  border-radius: var(--r-full);
}

.card-top { display: flex; align-items: center; gap: 12px; }
.card-identity { min-width: 0; }
.customer-name { font-size: 14px; font-weight: 700; display: flex; align-items: center; }
.email-clip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.card-stats {
  display: flex;
  align-items: center;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg);
  padding: 12px 0;
}
.stat { flex: 1; text-align: center; }
.stat-value { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; }
.stat-label { font-size: 10px; font-weight: 600; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }
.stat-divider { width: 1px; height: 28px; background: rgba(var(--v-theme-on-surface), 0.1); }

.card-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.row-customer { display: flex; align-items: center; gap: 10px; }

@media (min-width: 640px) {
  .customer-cards { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 960px) {
  .hide-mobile { display: flex; }
  .customer-cards { grid-template-columns: repeat(3, 1fr); }

  .data-table {
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
    border-radius: var(--r-xl);
    overflow: hidden;
  }
  .data-table table { width: 100%; border-collapse: collapse; }
  .data-table th {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: rgb(var(--v-theme-on-surface-variant));
    padding: 14px 18px;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  }
  .data-table td {
    padding: 14px 18px;
    font-size: 13px;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table .text-right { text-align: right; }
}
</style>