<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useAdminInventoryStore } from '~/stores/Models/inventory.store'
import type { InventoryListItem } from '~/types/Models/inventory.type'

definePageMeta({ layout: 'admin' })

const store = useAdminInventoryStore()
const router = useRouter()

const search       = ref('')
const viewMode     = ref<'table' | 'cards'>('table')
const filterStock  = ref<'all' | 'ok' | 'low' | 'out'>('all')
const currentPage  = ref(1)

const FALLBACK_INVENTORIES: InventoryListItem[] = [
  {
    id: 'fb-1', quantity: 24, lowStockThreshold: 5,
    createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-07-10T00:00:00Z',
    productVariant: { id: 'v1', sku: 'AE-EBE-22', name: '22 pouces', productName: 'Ébène Lisse Frontal', productId: 'p1' },
  },
  {
    id: 'fb-2', quantity: 3, lowStockThreshold: 5,
    createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-07-12T00:00:00Z',
    productVariant: { id: 'v2', sku: 'AE-MIE-18', name: '18 pouces', productName: 'Miel Bouclé Bundle', productId: 'p2' },
  },
  {
    id: 'fb-3', quantity: 0, lowStockThreshold: 5,
    createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-07-09T00:00:00Z',
    productVariant: { id: 'v3', sku: 'AE-BOD-20', name: '20 pouces', productName: 'Body Wave Naturel', productId: 'p3' },
  },
]

const inventories     = ref<InventoryListItem[]>([])
const totalPages      = ref(1)
const usingFallback    = ref(false)

const loadInventories = async () => {
  const data = await store.fetchInventories({
    search: search.value || undefined,
    page: currentPage.value,
  })

  if (data.length) {
    inventories.value   = data
    totalPages.value    = store.pagination?.lastPage ?? 1
    usingFallback.value = false
  }
  else {
    // inventories.value    = FALLBACK_INVENTORIES
    // totalPages.value     = 1
    usingFallback.value  = true
  }
}

onMounted(loadInventories)
watch(search, () => { currentPage.value = 1; loadInventories() })
watch(currentPage, loadInventories)

function stockStatus(inv: InventoryListItem): { label: string; class: 'ok' | 'low' | 'out' } {
  if (inv.quantity <= 0) return { label: 'Rupture', class: 'out' }
  if (inv.quantity <= inv.lowStockThreshold) return { label: 'Stock faible', class: 'low' }
  return { label: 'En stock', class: 'ok' }
}

const summary = computed(() => ({
  all: inventories.value.length,
  ok:  inventories.value.filter(i => stockStatus(i).class === 'ok').length,
  low: inventories.value.filter(i => stockStatus(i).class === 'low').length,
  out: inventories.value.filter(i => stockStatus(i).class === 'out').length,
}))

const SUMMARY_CARDS = [
  { key: 'all' as const, label: 'Total (page)', icon: 'solar:pallete-2-line-duotone',        color: 'secondary' },
  { key: 'ok' as const,  label: 'En stock',       icon: 'solar:check-circle-line-duotone',    color: 'success' },
  { key: 'low' as const, label: 'Stock faible',    icon: 'solar:danger-triangle-line-duotone', color: 'warning' },
  { key: 'out' as const, label: 'Rupture',          icon: 'solar:close-circle-line-duotone',    color: 'error' },
]

function toggleFilter(key: typeof filterStock.value) {
  filterStock.value = filterStock.value === key ? 'all' : key
}

const filteredInventories = computed(() => {
  if (filterStock.value === 'all') return inventories.value
  return inventories.value.filter(i => stockStatus(i).class === filterStock.value)
})
console.log('data inventory =>',filteredInventories)

// ── Avatar produit — couleur déterministe par variante, cohérent avec le
// pattern déjà utilisé sur la page clients.
const AVATAR_RAMPS = ['secondary', 'info', 'success', 'warning', 'error'] as const
function avatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_RAMPS[Math.abs(hash) % AVATAR_RAMPS.length]
}
function initials(inv: InventoryListItem) {
  const name = inv.productVariant?.product?.name ?? 'PR'
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function goToDetail(inv: InventoryListItem) {
  router.push(`/backoffice/inventory/${inv.id}`)
}

// ── Action rapide — add/remove/adjust depuis la liste
const actionDialog  = ref(false)
const actionType     = ref<'add' | 'remove' | 'adjust'>('add')
const actionTarget   = ref<InventoryListItem | null>(null)
const actionQuantity = ref<number | null>(null)
const actionReason   = ref('')

function openAction(inv: InventoryListItem, type: 'add' | 'remove' | 'adjust') {
  actionTarget.value   = inv
  actionType.value     = type
  actionQuantity.value = type === 'adjust' ? inv.quantity : null
  actionReason.value   = ''
  actionDialog.value   = true
}

const actionLabels = {
  add: 'Ajouter du stock',
  remove: 'Retirer du stock',
  adjust: 'Ajuster la quantité',
}

async function confirmAction() {
  if (!actionTarget.value || actionQuantity.value === null) return

  const { id } = actionTarget.value
  let success = false

  if (actionType.value === 'add') {
    success = await store.addStock(id, actionQuantity.value, actionReason.value || undefined)
  } else if (actionType.value === 'remove') {
    success = await store.removeStock(id, actionQuantity.value, actionReason.value || undefined)
  } else {
    success = await store.adjust(id, actionQuantity.value, actionReason.value || undefined)
  }

  if (success) {
    const idx = inventories.value.findIndex(i => i.id === id)
    if (idx !== -1 && store.currentInventory) {
      inventories.value[idx] = { ...inventories.value[idx], quantity: store.currentInventory.quantity }
    }
    notify('Stock mis à jour avec succès.', 'success')
    actionDialog.value = false
  } else {
    notify('Une erreur est survenue — vérifie la quantité disponible.', 'error')
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[{ label: 'Inventaire', icon: 'solar:pallete-2-line-duotone' }]" />

    <div v-if="usingFallback" class="fallback-banner">
      <Icon icon="solar:info-circle-line-duotone" width="16" />
      Aucun inventaire réel pour le moment — aperçu avec des données d'exemple.
    </div>

    <div class="summary-grid">
      <button
        v-for="card in SUMMARY_CARDS" :key="card.key"
        class="summary-card" :class="{ active: filterStock === card.key }"
        @click="toggleFilter(card.key)"
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
        placeholder="Rechercher par produit, SKU..." class="search-field"
      >
        <template #prepend-inner><Icon icon="solar:magnifer-line-duotone" width="18" /></template>
      </v-text-field>

      <v-btn-toggle v-model="viewMode" mandatory density="comfortable" color="secondary" rounded="xl" class="hide-mobile">
        <v-btn value="table" size="small"><Icon icon="solar:list-line-duotone" width="18" /></v-btn>
        <v-btn value="cards" size="small"><Icon icon="solar:widget-2-line-duotone" width="18" /></v-btn>
      </v-btn-toggle>
    </div>

    <div v-if="store.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <div v-else-if="filteredInventories.length === 0" class="empty-block">
      <Icon icon="solar:pallete-2-line-duotone" width="36" />
      <p>Aucun stock trouvé.</p>
    </div>

    <!-- Table -->
    <div v-else-if="viewMode === 'table'" class="data-table hide-mobile">
      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th>SKU</th>
            <th class="text-right">Quantité</th>
            <th>Statut</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in filteredInventories" :key="inv.id" class="row-clickable" @click="goToDetail(inv)">
            <td>
              <div class="row-product-cell">
                <div class="avatar" :class="`bg-${avatarColor(inv.id)}`">{{ initials(inv) }}</div>
                <div>
                  <div class="row-product">{{ inv.productVariant?.product.name ?? 'Produit' }}</div>
                  <div class="muted">{{ inv.productVariant?.name }}</div>
                </div>
              </div>
            </td>
            <td class="muted">{{ inv.productVariant?.sku ?? '—' }}</td>
            <td class="text-right amount">{{ inv.quantity }}</td>
            <td><span class="stock-badge" :class="stockStatus(inv).class">{{ stockStatus(inv).label }}</span></td>
            <td class="text-right" @click.stop>
              <v-btn icon variant="text" size="34" @click="openAction(inv, 'add')">
                <Icon icon="solar:add-circle-line-duotone" width="17" />
              </v-btn>
              <v-btn icon variant="text" size="34" :disabled="inv.quantity <= 0" @click="openAction(inv, 'remove')">
                <Icon icon="solar:minus-circle-line-duotone" width="17" />
              </v-btn>
              <v-btn icon variant="text" size="34" @click="openAction(inv, 'adjust')">
                <Icon icon="solar:pen-line-duotone" width="16" />
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cards premium -->
    <div v-else class="inventory-cards">
      <div v-for="inv in filteredInventories" :key="inv.id" class="inventory-card" @click="goToDetail(inv)">

        <div class="card-top">
          <div class="avatar avatar-lg" :class="`bg-${avatarColor(inv.id)}`">{{ initials(inv) }}</div>
          <div class="card-identity">
            <div class="row-product">{{ inv.productVariant?.productName ?? 'Produit' }}</div>
            <div class="muted">{{ inv.productVariant?.name }} · {{ inv.productVariant?.sku ?? '—' }}</div>
          </div>
        </div>

        <span class="stock-badge floating" :class="stockStatus(inv).class">{{ stockStatus(inv).label }}</span>

        <div class="card-stats">
          <div class="stat">
            <div class="stat-value" :class="stockStatus(inv).class">{{ inv.quantity }}</div>
            <div class="stat-label">En stock</div>
          </div>
          <div class="stat-divider" />
          <div class="stat">
            <div class="stat-value">{{ inv.lowStockThreshold }}</div>
            <div class="stat-label">Seuil alerte</div>
          </div>
        </div>

        <div class="card-footer">
          <Icon icon="solar:clock-circle-line-duotone" width="13" />
          Maj le {{ formatDate(inv.updatedAt) }}
        </div>

        <div class="card-actions" @click.stop>
          <v-btn variant="elevated" color="secondary" rounded="xl" size="32" @click="openAction(inv, 'add')">
            <Icon icon="solar:add-circle-line-duotone" width="20" style="margin-right: 4px;" />
            Ajouter
          </v-btn>
          <v-btn variant="tonal" color="error" rounded="xl" size="32" :disabled="inv.quantity <= 0" @click="openAction(inv, 'remove')">
            <Icon icon="solar:minus-circle-line-duotone" width="20" style="margin-right: 4px;" />
            Retirer
          </v-btn>
          <v-btn icon variant="tonal" color="primary" rounded="xl" size="32" @click="openAction(inv, 'adjust')">
            <Icon icon="solar:pen-line-duotone" width="18" />
          </v-btn>
        </div>
      </div>
    </div>

    <UiPagination v-if="!usingFallback" v-model="currentPage" :total-pages="totalPages" />

    <!-- Dialog action rapide -->
    <v-dialog v-model="actionDialog" max-width="380">
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="text-body-1 font-weight-bold">{{ actionLabels[actionType] }}</v-card-title>
        <v-card-text>
          <div class="dialog-product">{{ actionTarget?.productVariant?.productName }} — {{ actionTarget?.productVariant?.name }}</div>
          <div v-if="actionType !== 'adjust'" class="muted mb-3">Stock actuel : {{ actionTarget?.quantity }}</div>

          <v-text-field
            v-model.number="actionQuantity"
            :label="actionType === 'adjust' ? 'Nouvelle quantité exacte' : 'Quantité'"
            type="number" min="0"
            variant="solo-filled" flat rounded="xl" density="comfortable" hide-details class="mb-3"
          />
          <v-text-field
            v-model="actionReason"
            label="Motif (optionnel)"
            variant="solo-filled" flat rounded="xl" density="comfortable" hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="actionDialog = false">Annuler</v-btn>
          <v-btn
            color="secondary" variant="flat" rounded="xl"
            :loading="store.actionLoading" :disabled="actionQuantity === null" @click="confirmAction"
          >
            Confirmer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<style scoped>
.hide-mobile { display: none; }

.fallback-banner {
  display: flex; align-items: center; gap: 8px;
  background: rgba(var(--v-theme-secondary), 0.08); color: rgb(var(--v-theme-secondary));
  border-radius: var(--r-lg); padding: 10px 14px; font-size: 12px; font-weight: 600;
  margin-bottom: 14px;
}

.summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 18px; }
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

.toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
.search-field { flex: 1; }

.loading-block, .empty-block {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px 0; color: rgb(var(--v-theme-on-surface-variant));
}

.row-clickable { cursor: pointer; }
.row-clickable:hover { background: rgba(var(--v-theme-secondary), 0.04); }
.row-product-cell { display: flex; align-items: center; gap: 10px; }

.muted { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); }
.amount { font-weight: 700; }

.row-product { font-size: 13px; font-weight: 700; }

.stock-badge { display: inline-flex; padding: 3px 10px; border-radius: var(--r-full); font-size: 10px; font-weight: 700; }
.stock-badge.ok  { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.stock-badge.low { background: rgba(217, 164, 65, 0.15); color: #B8862F; }
.stock-badge.out { background: rgba(192, 83, 62, 0.12); color: #C0533E; }

/* Avatar */
.avatar {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #FAFAF8; flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.avatar-lg { width: 46px; height: 46px; font-size: 14px; }
.bg-secondary { background: rgb(var(--v-theme-secondary)); }
.bg-info      { background: #6E8FB8; }
.bg-success   { background: #4C7A4C; }
.bg-warning   { background: #B8862F; }
.bg-error     { background: #C0533E; }

/* Cards premium */
.inventory-cards { display: grid; grid-template-columns: 1fr; gap: 14px; }
.inventory-card {
  position: relative;
  display: flex; flex-direction: column; gap: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 18px;
  cursor: pointer;
  transition: border-color .2s, transform .2s, box-shadow .2s;
}
.inventory-card:hover {
  border-color: rgb(var(--v-theme-secondary));
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.card-top { display: flex; align-items: center; gap: 12px; padding-right: 90px; }
.card-identity { min-width: 0; }

.stock-badge.floating {
  position: absolute; top: 18px; right: 18px;
}

.card-stats {
  display: flex; align-items: center;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg); padding: 12px 0;
}
.stat { flex: 1; text-align: center; }
.stat-value { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; }
.stat-value.low { color: #B8862F; }
.stat-value.out { color: #C0533E; }
.stat-label { font-size: 10px; font-weight: 600; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }
.stat-divider { width: 1px; height: 28px; background: rgba(var(--v-theme-on-surface), 0.1); }

.card-footer {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: rgb(var(--v-theme-on-surface-variant));
}

.card-actions { display: flex; gap: 6px; }
.card-actions .v-btn:first-child { flex: 1; }
.card-actions .v-btn:nth-child(2) { flex: 1; }

.dialog-product { font-size: 13px; font-weight: 700; margin-bottom: 4px; }

@media (min-width: 640px) {
  .inventory-cards { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 960px) {
  .hide-mobile { display: flex; }
  .summary-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .summary-card { padding: 16px; }
  .summary-icon { width: 42px; height: 42px; }
  .summary-value { font-size: 22px; }

  .inventory-cards { grid-template-columns: repeat(3, 1fr); }

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
</style>