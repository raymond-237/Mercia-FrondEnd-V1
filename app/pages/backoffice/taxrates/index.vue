<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import type { TaxRateListItem } from '~/services/Models/taxrate.service'
import { useAdminTaxRatesStore } from '~/stores/Models/taxrates.stores'

definePageMeta({ layout: 'admin' })

const store = useAdminTaxRatesStore()

const FALLBACK_RATES: TaxRateListItem[] = [
  { id: 'fb-1', name: 'TVA France', rate: 20,   countryCode: 'FR', isDefault: true,  isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'fb-2', name: 'TVA Belgique', rate: 21, countryCode: 'BE', isDefault: false, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
]

const rates         = ref<TaxRateListItem[]>([])
const usingFallback = ref(false)
const deleteTarget  = ref<TaxRateListItem | null>(null)

// ── Recherche + filtration — tout côté client, la liste des taux étant
// typiquement courte (pas de pagination serveur sur cet endpoint).
const search       = ref('')
const filterStatus = ref<'all' | 'active' | 'inactive'>('all')

const loadRates = async () => {
  const data = await store.fetchRates()
  if (data.length) {
    rates.value          = data
    usingFallback.value  = false
  }
  else {
    // rates.value           = FALLBACK_RATES
    usingFallback.value   = true
  }
}
onMounted(loadRates)

watch(() => store.rates, (val) => {
  if (val.length) { rates.value = val; usingFallback.value = false }
}, { deep: true })

const filteredRates = computed(() => {
  let list = rates.value

  if (filterStatus.value !== 'all') {
    const wantActive = filterStatus.value === 'active'
    list = list.filter(r => r.isActive === wantActive)
  }

  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.countryCode ?? '').toLowerCase().includes(q),
    )
  }

  return list
})

const summary = computed(() => ({
  all:      rates.value.length,
  active:   rates.value.filter(r => r.isActive).length,
  inactive: rates.value.filter(r => !r.isActive).length,
}))

function toggleStatusFilter(key: 'active' | 'inactive') {
  filterStatus.value = filterStatus.value === key ? 'all' : key
}
function clearSearch() {
  search.value = ''
}

async function onDelete() {
  if (!deleteTarget.value) return
  const success = await store.deleteRate(deleteTarget.value.id)
  deleteTarget.value = null
  if (success) notify('Taux supprimé.', 'success')
  else notify('Une erreur est survenue.', 'error')
}

function countryLabel(code: string | null) {
  if (!code) return 'Tous pays'
  return code.toUpperCase()
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[{ label: 'Taux de taxe', icon: 'solar:calculator-line-duotone' }]">
      <v-btn color="secondary" variant="flat" rounded="xl" to="/backoffice/taxrates/new">
        <Icon icon="solar:add-circle-line-duotone" width="18" style="margin-right: 6px;" />
        <span class="hide-mobile-text">Nouveau taux</span>
      </v-btn>
    </UiBreadCrumbs>

    <div v-if="usingFallback" class="fallback-banner">
      <Icon icon="solar:info-circle-line-duotone" width="16" />
      Aucun taux réel pour le moment — aperçu avec des données d'exemple.
    </div>

    <!-- Cards de synthèse — filtre rapide -->
    <div class="summary-grid">
      <button
        class="summary-card" :class="{ active: filterStatus === 'active' }"
        @click="toggleStatusFilter('active')"
      >
        <v-sheet color="success" rounded="xl" class="summary-icon" variant="tonal">
          <Icon icon="solar:check-circle-line-duotone" width="20" />
        </v-sheet>
        <div>
          <div class="summary-value">{{ summary.active }}</div>
          <div class="summary-label">Actifs</div>
        </div>
      </button>
      <button
        class="summary-card" :class="{ active: filterStatus === 'inactive' }"
        @click="toggleStatusFilter('inactive')"
      >
        <v-sheet color="secondary" rounded="xl" class="summary-icon" variant="tonal">
          <Icon icon="solar:close-circle-line-duotone" width="20" />
        </v-sheet>
        <div>
          <div class="summary-value">{{ summary.inactive }}</div>
          <div class="summary-label">Inactifs</div>
        </div>
      </button>
    </div>

    <!-- Recherche -->
    <div class="toolbar">
      <v-text-field
        v-model="search" variant="solo-filled" density="comfortable" flat hide-details rounded="xl"
        placeholder="Rechercher par nom ou pays..." class="search-field"
      >
        <template #prepend-inner><Icon icon="solar:magnifer-line-duotone" width="18" /></template>
        <template v-if="search" #append-inner>
          <Icon icon="solar:close-circle-line-duotone" width="16" class="clear-icon" @click="clearSearch" />
        </template>
      </v-text-field>
    </div>

    <div v-if="store.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <div v-else-if="filteredRates.length === 0" class="empty-block">
      <Icon icon="solar:calculator-line-duotone" width="36" />
      <p>{{ rates.length === 0 ? 'Aucun taux de taxe configuré.' : 'Aucun résultat pour cette recherche.' }}</p>
    </div>

    <div v-else class="rates-grid">
      <NuxtLink v-for="r in filteredRates" :key="r.id" :to="`/backoffice/taxrates/${r.id}`" class="rate-card">
        <div class="rate-top">
          <div class="rate-value">{{ r.rate }}%</div>
          <span v-if="r.isDefault" class="default-badge">
            <Icon icon="solar:star-bold" width="10" style="margin-right: 3px;" />
            Par défaut
          </span>
        </div>

        <div class="rate-name">{{ r.name }}</div>

        <div class="rate-footer">
          <span class="country-chip">
            <Icon icon="solar:global-line-duotone" width="13" />
            {{ countryLabel(r.countryCode) }}
          </span>
          <span class="status-badge" :class="r.isActive ? 'active' : 'inactive'">
            {{ r.isActive ? 'Actif' : 'Inactif' }}
          </span>
        </div>

        <button class="delete-btn" @click.prevent.stop="deleteTarget = r">
          <Icon icon="solar:trash-bin-trash-line-duotone" width="15" />
        </button>
      </NuxtLink>
    </div>

    <v-dialog v-model="deleteTarget" max-width="360">
      <v-card v-if="deleteTarget" rounded="xl" class="pa-2">
        <v-card-title class="text-body-1 font-weight-bold">Supprimer ce taux ?</v-card-title>
        <v-card-text class="text-body-2">
          "{{ deleteTarget.name }}" sera définitivement supprimé.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteTarget = null">Annuler</v-btn>
          <v-btn color="error" variant="flat" rounded="xl" @click="onDelete">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

.summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
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

.toolbar { margin-bottom: 16px; }
.search-field { flex: 1; }
.clear-icon { cursor: pointer; color: rgb(var(--v-theme-on-surface-variant)); }

.loading-block, .empty-block {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px 0; color: rgb(var(--v-theme-on-surface-variant));
}

.rates-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.rate-card {
  position: relative;
  display: block;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 18px;
  text-decoration: none; color: inherit;
  transition: border-color .2s, transform .2s, box-shadow .2s;
}
.rate-card:hover { border-color: rgb(var(--v-theme-secondary)); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); }

.rate-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding-right: 30px; }
.rate-value { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 700; color: rgb(var(--v-theme-secondary)); }
.rate-name { font-size: 13px; font-weight: 700; margin-bottom: 14px; }

.default-badge {
  display: flex; align-items: center;
  background: rgba(184, 134, 47, 0.12); color: #B8862F;
  font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: var(--r-full);
}

.rate-footer { display: flex; align-items: center; justify-content: space-between; }
.country-chip {
  display: flex; align-items: center; gap: 5px;
  background: rgb(var(--v-theme-surface-variant));
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: var(--r-full);
}

.status-badge { display: inline-flex; padding: 3px 10px; border-radius: var(--r-full); font-size: 10px; font-weight: 700; }
.status-badge.active   { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.status-badge.inactive { background: rgba(var(--v-theme-on-surface), 0.08); color: rgb(var(--v-theme-on-surface-variant)); }

.delete-btn {
  position: absolute; top: 16px; right: 16px;
  width: 28px; height: 28px; border-radius: 50%;
  background: none; border: none; cursor: pointer;
  color: rgb(var(--v-theme-on-surface-variant));
  display: flex; align-items: center; justify-content: center;
}
.delete-btn:hover { color: #C0533E; }

@media (min-width: 640px) {
  .rates-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 960px) {
  .hide-mobile-text { display: inline; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); max-width: 400px; }
  .rates-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>