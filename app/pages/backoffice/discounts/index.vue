<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useAdminDiscountCodesStore } from '~/stores/Models/discountCodes.store'
import type { DiscountCodeListItem } from '~/types/Models/discountCode.type'

definePageMeta({ layout: 'admin' })

const store = useAdminDiscountCodesStore()
const router = useRouter()

const search      = ref('')
const filterStatus = ref<'all' | 'active' | 'inactive'>('all')
const currentPage = ref(1)

const FALLBACK_CODES: DiscountCodeListItem[] = [
  {
    id: 'fb-1', code: 'BIENVENUE10', type: 'percentage', value: 10,
    appliesTo: 'order', appliesToId: null, minOrderAmount: 50, maxUses: 200, usedCount: 84,
    isActive: true, startsAt: null, expiresAt: '2026-12-31T23:59:59Z', createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'fb-2', code: 'MECHES20', type: 'fixed', value: 20,
    appliesTo: 'category', appliesToId: 'cat-1', minOrderAmount: null, maxUses: 50, usedCount: 50,
    isActive: true, startsAt: null, expiresAt: null, createdAt: '2026-05-10T00:00:00Z',
  },
]

const codes         = ref<DiscountCodeListItem[]>([])
const totalPages    = ref(1)
const usingFallback = ref(false)

function status(c: DiscountCodeListItem): { label: string; class: 'active' | 'inactive' | 'expired' | 'exhausted' } {
  if (!c.isActive) return { label: 'Inactif', class: 'inactive' }
  if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { label: 'Expiré', class: 'expired' }
  if (c.maxUses && c.usedCount >= c.maxUses) return { label: 'Épuisé', class: 'exhausted' }
  return { label: 'Actif', class: 'active' }
}

const loadCodes = async () => {
  const data = await store.fetchCodes({
    search: search.value || undefined,
    status: filterStatus.value !== 'all' ? filterStatus.value : undefined,
    page: currentPage.value,
  })
  if (data.length) {
    codes.value         = data
    totalPages.value    = store.pagination?.lastPage ?? 1
    usingFallback.value = false
  }
  else {
    // codes.value          = FALLBACK_CODES
    // totalPages.value     = 1
    usingFallback.value  = true
  }
}
onMounted(loadCodes)
watch(search, () => { currentPage.value = 1; loadCodes() })
watch(currentPage, loadCodes)

const summary = computed(() => ({
  all:      codes.value.length,
  active:   codes.value.filter(c => status(c).class === 'active').length,
  expired:  codes.value.filter(c => status(c).class === 'expired').length,
  exhausted: codes.value.filter(c => status(c).class === 'exhausted').length,
}))

const SUMMARY_CARDS = [
  { key: 'all' as const,       label: 'Total',   icon: 'solar:ticket-sale-line-duotone',      color: 'secondary' },
  { key: 'active' as const,    label: 'Actifs',  icon: 'solar:check-circle-line-duotone',      color: 'success' },
  { key: 'expired' as const,   label: 'Expirés', icon: 'solar:calendar-mark-line-duotone',     color: 'warning' },
  { key: 'exhausted' as const, label: 'Épuisés', icon: 'solar:close-circle-line-duotone',      color: 'error' },
]

function formatDiscount(c: DiscountCodeListItem) {
  return c.discountType  === 'percentage' ? `-${c.value}%` : `-${c.value}€`
}
function formatDate(iso: string | null) {
  if (!iso) return 'Sans limite'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function usagePercent(c: DiscountCodeListItem) {
  if (!c.maxUses) return null
  return Math.min(100, Math.round((c.usedCount / c.maxUses) * 100))
}

async function copyCode(code: string, e: Event) {
  e.stopPropagation()
  await navigator.clipboard.writeText(code)
  notify(`Code "${code}" copié.`, 'success')
}

async function onToggleActive(c: DiscountCodeListItem, e: Event) {
  e.stopPropagation()
  const success = await store.toggleActive(c.id)
  if (success) {
    const idx = codes.value.findIndex(x => x.id === c.id)
    if (idx !== -1) codes.value[idx] = { ...codes.value[idx], isActive: !codes.value[idx].isActive }
    notify('Statut mis à jour.', 'success')
  } else {
    notify('Une erreur est survenue.', 'error')
  }
}

function goToDetail(c: DiscountCodeListItem) {
  router.push(`/backoffice/discounts/${c.id}`)
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[{ label: 'Codes promo', icon: 'solar:ticket-sale-line-duotone' }]">
      <v-btn color="secondary" variant="flat" rounded="xl" to="/backoffice/discounts/new">
        <Icon icon="solar:add-circle-line-duotone" width="18" style="margin-right: 6px;" />
        <span class="hide-mobile-text">Nouveau code</span>
      </v-btn>
    </UiBreadCrumbs>

    <div v-if="usingFallback" class="fallback-banner">
      <Icon icon="solar:info-circle-line-duotone" width="16" />
      Aucun code réel pour le moment — aperçu avec des données d'exemple.
    </div>

    <div class="summary-grid">
      <div v-for="card in SUMMARY_CARDS" :key="card.key" class="summary-card">
        <v-sheet :color="card.color" rounded="xl" class="summary-icon" variant="tonal">
          <Icon :icon="card.icon" width="20" />
        </v-sheet>
        <div>
          <div class="summary-value">{{ summary[card.key] }}</div>
          <div class="summary-label">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <v-text-field
        v-model="search" variant="solo-filled" density="comfortable" flat hide-details rounded="xl"
        placeholder="Rechercher un code..." class="search-field"
      >
        <template #prepend-inner><Icon icon="solar:magnifer-line-duotone" width="18" /></template>
      </v-text-field>

      <v-btn-toggle v-model="filterStatus" mandatory density="comfortable" color="secondary" rounded="xl">
        <v-btn value="all" size="small">Tous</v-btn>
        <v-btn value="active" size="small">Actifs</v-btn>
        <v-btn value="inactive" size="small">Inactifs</v-btn>
      </v-btn-toggle>
    </div>

    <div v-if="store.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <div v-else-if="codes.length === 0" class="empty-block">
      <Icon icon="solar:ticket-sale-line-duotone" width="36" />
      <p>Aucun code promo.</p>
    </div>

    <div v-else class="codes-grid">
      <div v-for="c in codes" :key="c.id" class="code-card" @click="goToDetail(c)">

        <div class="code-top">
          <div class="code-tag">
            <span class="code-text">{{ c.code }}</span>
            <button class="copy-btn" @click="copyCode(c.code, $event)">
              <Icon icon="solar:copy-line-duotone" width="14" />
            </button>
          </div>
          <span class="status-badge" :class="status(c).class">{{ status(c).label }}</span>
        </div>

        <div class="code-discount">{{ formatDiscount(c) }}</div>
        <div class="code-scope muted">
          <Icon
            :icon="c.appliesTo === 'order' ? 'solar:bag-4-line-duotone' : c.appliesTo === 'category' ? 'solar:folder-line-duotone' : 'solar:box-line-duotone'"
            width="13"
          />
          {{ c.appliesTo === 'order' ? 'Toute la commande' : c.appliesTo === 'category' ? 'Catégorie ciblée' : 'Produit ciblé' }}
          <template v-if="c.minOrderAmount"> · dès {{ c.minOrderAmount }}€</template>
        </div>

        <div v-if="c.maxUses" class="usage-block">
          <div class="usage-row">
            <span class="muted">{{ c.usedCount }} / {{ c.maxUses }} utilisations</span>
            <span class="muted">{{ usagePercent(c) }}%</span>
          </div>
          <div class="usage-bar">
            <div class="usage-fill" :class="{ full: usagePercent(c) === 100 }" :style="{ width: `${usagePercent(c)}%` }" />
          </div>
        </div>
        <div v-else class="muted usage-unlimited">
          <Icon icon="solar:infinity-line-duotone" width="13" />
          Utilisations illimitées · {{ c.usedCount }} utilisé{{ c.usedCount > 1 ? 's' : '' }}
        </div>

        <div class="code-footer">
          <div class="muted expiry">
            <Icon icon="solar:calendar-line-duotone" width="13" />
            {{ formatDate(c.expiresAt) }}
          </div>
          <v-switch
            :model-value="c.isActive"
            density="compact" color="secondary" hide-details inset
            @click="onToggleActive(c, $event)"
          />
        </div>

      </div>
    </div>

    <UiPagination v-if="!usingFallback" v-model="currentPage" :total-pages="totalPages" />

  </div>
</template>

<style scoped>
.hide-mobile-text { display: none; }

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
  border-radius: var(--r-lg); padding: 12px;
}
.summary-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.summary-value { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; line-height: 1.1; }
.summary-label { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); font-weight: 600; }

.toolbar { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.search-field { flex: 1; }

.loading-block, .empty-block {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px 0; color: rgb(var(--v-theme-on-surface-variant));
}

.codes-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
.code-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 18px;
  cursor: pointer;
  transition: border-color .2s, transform .2s, box-shadow .2s;
}
.code-card:hover { border-color: rgb(var(--v-theme-secondary)); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); }

.code-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.code-tag {
  display: flex; align-items: center; gap: 6px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-md); padding: 6px 10px;
}
.code-text { font-family: monospace; font-size: 13px; font-weight: 700; letter-spacing: 0.03em; }
.copy-btn { border: none; background: none; cursor: pointer; color: rgb(var(--v-theme-on-surface-variant)); display: flex; }
.copy-btn:hover { color: rgb(var(--v-theme-secondary)); }

.code-discount { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; color: rgb(var(--v-theme-secondary)); margin-bottom: 4px; }
.code-scope { display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 14px; }
.muted { color: rgb(var(--v-theme-on-surface-variant)); }

.usage-block { margin-bottom: 14px; }
.usage-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; }
.usage-bar { height: 6px; border-radius: var(--r-full); background: rgb(var(--v-theme-surface-variant)); overflow: hidden; }
.usage-fill { height: 100%; background: rgb(var(--v-theme-secondary)); border-radius: var(--r-full); transition: width .3s; }
.usage-fill.full { background: #C0533E; }
.usage-unlimited { display: flex; align-items: center; gap: 6px; font-size: 11.5px; margin-bottom: 14px; }

.code-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }
.expiry { display: flex; align-items: center; gap: 6px; font-size: 11.5px; }

.status-badge { display: inline-flex; padding: 3px 10px; border-radius: var(--r-full); font-size: 10px; font-weight: 700; flex-shrink: 0; }
.status-badge.active    { background: rgba(76, 122, 76, 0.12);   color: #4C7A4C; }
.status-badge.inactive  { background: rgba(var(--v-theme-on-surface), 0.08); color: rgb(var(--v-theme-on-surface-variant)); }
.status-badge.expired   { background: rgba(217, 164, 65, 0.15); color: #B8862F; }
.status-badge.exhausted { background: rgba(192, 83, 62, 0.12); color: #C0533E; }

@media (min-width: 640px) {
  .toolbar { flex-direction: row; }
  .codes-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 960px) {
  .hide-mobile-text { display: inline; }
  .summary-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .summary-card { padding: 16px; }
  .summary-icon { width: 42px; height: 42px; }
  .summary-value { font-size: 22px; }
  .codes-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1280px) {
  .codes-grid { grid-template-columns: repeat(4, 1fr); }
}
</style>