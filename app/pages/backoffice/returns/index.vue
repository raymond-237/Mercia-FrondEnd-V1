<script setup lang="ts">
import { useAdminReturnRequestsStore } from '~/stores/Models/returnrequest.store'
import type { ReturnRequestListItem, ReturnStatus, ReturnResolution } from '~/types/Models/returnRequest.type'

definePageMeta({ layout: 'admin' })

const store = useAdminReturnRequestsStore()

const search        = ref('')
const viewMode      = ref<'table' | 'cards'>('table')
const filterOpen    = ref(false)
const filterStatus  = ref<'all' | ReturnStatus>('all')
const filterSort    = ref('-createdAt')
const currentPage   = ref(1)

const SORT_OPTIONS = [
  { title: 'Plus récentes',    value: '-createdAt' },
  { title: 'Plus anciennes',   value: 'createdAt' },
]

const FALLBACK_RETURNS: ReturnRequestListItem[] = [
  {
    id: 'fb-1', status: 'pending', reason: 'Taille ne convient pas', notes: null,
    createdAt: '2026-07-12T10:00:00Z', itemsCount: 1,
    order: { id: 'o1', orderNumber: 'AE-2026-000123', total: 634.90 },
    user: { id: 'u1', firstName: 'Marie', lastName: 'Dubois', email: 'marie.dubois@example.com' },
  },
  {
    id: 'fb-2', status: 'approved', reason: 'Article défectueux', notes: null,
    createdAt: '2026-07-10T15:20:00Z', itemsCount: 2,
    order: { id: 'o2', orderNumber: 'AE-2026-000098', total: 349.00 },
    user: { id: 'u2', firstName: 'Fatou', lastName: 'Diallo', email: 'fatou.diallo@example.com' },
  },
]

const returns        = ref<ReturnRequestListItem[]>([])
const totalPages     = ref(1)
const usingFallback  = ref(false)

const SUMMARY_CARDS = [
  { key: 'pending' as const,   label: 'En attente',  icon: 'solar:clock-circle-line-duotone',    color: 'warning' },
  { key: 'approved' as const,  label: 'Approuvées',  icon: 'solar:check-circle-line-duotone',     color: 'info' },
  { key: 'completed' as const, label: 'Complétées',  icon: 'solar:box-line-duotone',              color: 'success' },
  { key: 'rejected' as const,  label: 'Rejetées',    icon: 'solar:close-circle-line-duotone',     color: 'error' },
]

const summary = computed(() => ({
  pending:   returns.value.filter(r => r.status === 'pending').length,
  approved:  returns.value.filter(r => r.status === 'approved').length,
  completed: returns.value.filter(r => r.status === 'completed').length,
  rejected:  returns.value.filter(r => r.status === 'rejected').length,
}))

const loadReturns = async () => {
  const data = await store.fetchReturns({
    status: filterStatus.value !== 'all' ? filterStatus.value : undefined,
    sort: filterSort.value,
    page: currentPage.value,
  })

  if (data.length) {
    returns.value       = data
    totalPages.value    = store.pagination?.lastPage ?? 1
    usingFallback.value = false
  }
  else {
    // returns.value        = FALLBACK_RETURNS
    // totalPages.value     = 1
    usingFallback.value  = true
  }
}

onMounted(loadReturns)
watch(currentPage, loadReturns)

// ── Recherche — appliquée côté client sur la page actuellement chargée
// (commande, client, motif). Le statut/tri, eux, sont déjà filtrés côté
// serveur en amont via loadReturns().
const filteredReturns = computed(() => {
  if (!search.value.trim()) return returns.value
  const q = search.value.trim().toLowerCase()
  return returns.value.filter(r =>
    (r.order?.orderNumber ?? '').toLowerCase().includes(q) ||
    (r.user ? `${r.user.firstName} ${r.user.lastName} ${r.user.email}` : '').toLowerCase().includes(q) ||
    r.reason.toLowerCase().includes(q),
  )
})

function clearSearch() {
  search.value = ''
}

function toggleQuickFilter(key: ReturnStatus) {
  filterStatus.value = filterStatus.value === key ? 'all' : key
  currentPage.value  = 1
  loadReturns()
}

function applyFilters() {
  filterOpen.value  = false
  currentPage.value = 1
  loadReturns()
}
function resetFilters() {
  filterStatus.value = 'all'
  filterSort.value    = '-createdAt'
  filterOpen.value    = false
  currentPage.value   = 1
  loadReturns()
}

const STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: 'En attente', approved: 'Approuvée', rejected: 'Rejetée', completed: 'Complétée',
}
const RESOLUTION_LABELS: Record<ReturnResolution, string> = {
  refund: 'Remboursement', exchange: 'Échange', store_credit: 'Avoir',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const activeFilterCount = computed(() => filterSort.value !== '-createdAt' ? 1 : 0)
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[{ label: 'Retours', icon: 'solar:map-arrow-left-line-duotone' }]" />

    <div v-if="usingFallback" class="fallback-banner">
      <Icon icon="solar:info-circle-line-duotone" width="16" />
      Aucune demande réelle pour le moment — aperçu avec des données d'exemple.
    </div>

    <div class="summary-grid">
      <button
        v-for="card in SUMMARY_CARDS" :key="card.key"
        class="summary-card" :class="{ active: filterStatus === card.key }"
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
        v-model="search" variant="solo-filled" density="comfortable" flat hide-details rounded="xl"
        placeholder="Rechercher une commande, un client, un motif..." class="search-field"
      >
        <template #prepend-inner><Icon icon="solar:magnifer-line-duotone" width="18" /></template>
        <template v-if="search" #append-inner>
          <Icon icon="solar:close-circle-line-duotone" width="16" class="clear-icon" @click="clearSearch" />
        </template>
      </v-text-field>

      <v-btn variant="tonal" color="secondary" rounded="xl" @click="filterOpen = true">
        <Icon icon="solar:tuning-2-line-duotone" width="18" style="margin-right: 6px;" />
        <span class="hide-mobile-text">Filtrer</span>
        <v-chip v-if="activeFilterCount" size="x-small" color="secondary" class="ml-2">{{ activeFilterCount }}</v-chip>
      </v-btn>

      <v-btn-toggle v-model="viewMode" mandatory density="comfortable" color="secondary" rounded="xl" class="hide-mobile">
        <v-btn value="table" size="small">
          <Icon icon="solar:list-line-duotone" width="18" />
        </v-btn>
        <v-btn value="cards" size="small">
          <Icon icon="solar:widget-2-line-duotone" width="18" />
        </v-btn>
      </v-btn-toggle>
    </div>

    <p v-if="search" class="scope-hint">
      <Icon icon="solar:info-circle-line-duotone" width="13" />
      Recherche appliquée sur la page {{ currentPage }} uniquement — change de page pour chercher ailleurs.
    </p>

    <div v-if="store.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <div v-else-if="filteredReturns.length === 0" class="empty-block">
      <Icon icon="solar:box-minimalistic-line-duotone" width="36" />
      <p>{{ returns.length === 0 ? 'Aucune demande de retour.' : 'Aucun résultat pour cette recherche.' }}</p>
    </div>

    <!-- Table -->
    <div v-else-if="viewMode === 'table'" class="data-table hide-mobile">
      <table>
        <thead>
          <tr>
            <th>Statut</th>
            <th>Commande</th>
            <th>Client</th>
            <th>Motif</th>
            <th class="text-right">Articles</th>
            <th>Date</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredReturns" :key="r.id">
            <td><span class="status-badge" :class="r.status">{{ STATUS_LABELS[r.status] }}</span></td>
            <td class="row-order">{{ r.order?.orderNumber ?? '—' }}</td>
            <td>{{ r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Client inconnu' }}</td>
            <td class="muted reason-cell">{{ r.reason }}</td>
            <td class="text-right">{{ r.itemsCount }}</td>
            <td class="muted">{{ formatDate(r.createdAt) }}</td>
            <td class="text-right">
              <v-btn icon variant="text" size="36" :to="`/backoffice/returns/${r.id}`">
                <Icon icon="solar:eye-line-duotone" width="17" />
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cards -->
    <div v-else class="returns-list">
      <NuxtLink v-for="r in filteredReturns" :key="r.id" :to="`/backoffice/returns/${r.id}`" class="return-card">
        <div class="return-main">
          <div class="return-top">
            <span class="status-badge" :class="r.status">{{ STATUS_LABELS[r.status] }}</span>
            <span class="return-order">{{ r.order?.orderNumber ?? '—' }}</span>
          </div>
          <div class="return-customer">{{ r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Client inconnu' }}</div>
          <div class="return-reason">{{ r.reason }}</div>
        </div>
        <div class="return-meta">
          <div class="muted">{{ r.itemsCount }} article{{ r.itemsCount > 1 ? 's' : '' }}</div>
          <div class="muted">{{ formatDate(r.createdAt) }}</div>
          <Icon icon="solar:alt-arrow-right-line-duotone" width="16" class="chevron" />
        </div>
      </NuxtLink>
    </div>

    <UiPagination v-if="!usingFallback" v-model="currentPage" :total-pages="totalPages" />

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
            :items="[{ title: 'Tous les statuts', value: 'all' }, ...Object.entries(STATUS_LABELS).map(([value, title]) => ({ title, value }))]"
            variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-4"
          />

          <label class="filter-label">Trier par</label>
          <v-select
            v-model="filterSort"
            :items="SORT_OPTIONS"
            variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-4"
          />
        </div>

        <div class="filter-foot">
          <v-btn variant="tonal" color="surface-variant" rounded="xl" block @click="resetFilters">
            Réinitialiser
          </v-btn>
          <v-btn color="secondary" variant="flat" rounded="xl" block @click="applyFilters">
            Appliquer
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>

  </div>
</template>

<style scoped>
.hide-mobile { display: none; }
.hide-mobile-text { display: none; }

.fallback-banner {
  display: flex; align-items: center; gap: 8px;
  background: rgba(var(--v-theme-secondary), 0.08); color: rgb(var(--v-theme-secondary));
  border-radius: var(--r-lg); padding: 10px 14px; font-size: 12px; font-weight: 600;
  margin-bottom: 14px;
}

.summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
.summary-card {
  display: flex; align-items: center; gap: 10px;
  background: rgb(var(--v-theme-surface));
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-lg); padding: 12px; cursor: pointer; text-align: left;
  transition: border-color .2s;
}
.summary-card.active { border-color: rgb(var(--v-theme-secondary)); }
.summary-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.summary-value { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; line-height: 1.1; }
.summary-label { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); font-weight: 600; }

.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.search-field { flex: 1; }
.clear-icon { cursor: pointer; color: rgb(var(--v-theme-on-surface-variant)); }

.scope-hint {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 16px;
}

.loading-block, .empty-block {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px 0; color: rgb(var(--v-theme-on-surface-variant));
}

.returns-list { display: flex; flex-direction: column; gap: 10px; }
.return-card {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 16px 18px;
  text-decoration: none; color: inherit;
  transition: border-color .2s, transform .2s;
}
.return-card:hover { border-color: rgb(var(--v-theme-secondary)); transform: translateY(-1px); }

.return-main { min-width: 0; flex: 1; }
.return-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.return-order { font-size: 12px; font-weight: 700; color: rgb(var(--v-theme-secondary)); }
.return-customer { font-size: 13.5px; font-weight: 700; margin-bottom: 2px; }
.return-reason { font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.return-meta { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
.muted { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); white-space: nowrap; }
.chevron { color: rgb(var(--v-theme-on-surface-variant)); }

.row-order { font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-secondary)); }
.reason-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.status-badge { display: inline-flex; padding: 3px 10px; border-radius: var(--r-full); font-size: 10px; font-weight: 700; }
.status-badge.pending   { background: rgba(217, 164, 65, 0.15); color: #B8862F; }
.status-badge.approved  { background: rgba(110, 143, 184, 0.15); color: #6E8FB8; }
.status-badge.completed { background: rgba(76, 122, 76, 0.12);  color: #4C7A4C; }
.status-badge.rejected  { background: rgba(192, 83, 62, 0.12);  color: #C0533E; }

.filter-drawer { display: flex; flex-direction: column; height: 100%; padding: 20px; }
.filter-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.filter-head h3 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; }
.filter-body { flex: 1; }
.filter-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 8px; }
.filter-foot { display: flex; gap: 10px; padding-top: 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }

@media (min-width: 960px) {
  .hide-mobile { display: flex; }
  .hide-mobile-text { display: inline; }
  .summary-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .summary-card { padding: 16px; }
  .summary-icon { width: 42px; height: 42px; }
  .summary-value { font-size: 22px; }

  .data-table {
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
    border-radius: var(--r-xl); overflow: hidden;
  }
  .data-table table { width: 100%; border-collapse: collapse; }
  .data-table th {
    text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase;
    color: rgb(var(--v-theme-on-surface-variant)); padding: 14px 18px;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  }
  .data-table td { padding: 14px 18px; font-size: 13px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table .text-right { text-align: right; }
}

@media (max-width: 640px) {
  .return-card { flex-direction: column; align-items: stretch; }
  .return-meta { justify-content: space-between; }
}
</style>