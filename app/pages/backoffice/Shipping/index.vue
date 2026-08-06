<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useShippingStore } from '~/stores/Models/shipping.store'
import type { ShippingZoneFormData, ShippingMethodFormData } from '~/types/Models/shipping.type'

definePageMeta({ layout: 'admin' })

const store = useShippingStore()
const tab      = ref<'zones' | 'methods'>('zones')
const viewMode = ref<'table' | 'cards'>('table')

onMounted(() => store.fetchAll())

function money(value: unknown): string {
  const n = Number(value)
  if (Number.isNaN(n)) return '0.00'
  return n.toFixed(2)
}

// ── Recherche + filtration — contextuelle selon l'onglet actif
const search       = ref('')
const filterStatus = ref<'all' | 'active' | 'inactive'>('all')

watch(tab, () => {
  search.value       = ''
  filterStatus.value = 'all'
})

const filteredZones = computed(() => {
  if (!search.value.trim()) return store.zones
  const q = search.value.trim().toLowerCase()
  return store.zones.filter(z =>
    z.name.toLowerCase().includes(q) ||
    z.countries.some((c: string) => c.toLowerCase().includes(q)),
  )
})

const filteredMethods = computed(() => {
  let list = store.methods

  if (filterStatus.value !== 'all') {
    const wantActive = filterStatus.value === 'active'
    list = list.filter(m => m.isActive === wantActive)
  }

  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.zone?.name ?? '').toLowerCase().includes(q),
    )
  }

  return list
})

const methodSummary = computed(() => ({
  active:   store.methods.filter(m => m.isActive).length,
  inactive: store.methods.filter(m => !m.isActive).length,
}))

function toggleStatusFilter(key: 'active' | 'inactive') {
  filterStatus.value = filterStatus.value === key ? 'all' : key
}
function clearSearch() {
  search.value = ''
}

// -- Zone drawer
const zoneDrawerOpen = ref(false)
const zoneMode        = ref<'create' | 'edit'>('create')
const editingZone      = ref<(Partial<ShippingZoneFormData> & { id?: string }) | undefined>()

function openCreateZone() {
  zoneMode.value = 'create'
  editingZone.value = undefined
  zoneDrawerOpen.value = true
}
function openEditZone(zone: any) {
  zoneMode.value = 'edit'
  editingZone.value = { id: zone.id, name: zone.name, countries: [...zone.countries] }
  zoneDrawerOpen.value = true
}
async function onZoneSubmit(data: ShippingZoneFormData) {
  const success = zoneMode.value === 'create'
    ? await store.createZone(data)
    : await store.updateZone(editingZone.value!.id!, data)

  if (success) {
    zoneDrawerOpen.value = false
    notify(zoneMode.value === 'create' ? 'Zone creee avec succes.' : 'Zone mise a jour avec succes.', 'success')
  } else {
    notify('Une erreur est survenue, veuillez reessayer.', 'error')
  }
}

// -- Method drawer
const methodDrawerOpen = ref(false)
const methodMode         = ref<'create' | 'edit'>('create')
const editingMethod        = ref<(Partial<ShippingMethodFormData> & { id?: string }) | undefined>()

function openCreateMethod() {
  methodMode.value = 'create'
  editingMethod.value = undefined
  methodDrawerOpen.value = true
}
function openEditMethod(method: any) {
  methodMode.value = 'edit'
  editingMethod.value = {
    id: method.id, name: method.name, carrierCode: method.carrierCode ?? '', trackingUrl: method.trackingUrl ?? '',
    minDays: method.minDays, maxDays: method.maxDays, price: method.price, freeAbove: method.freeAbove ?? null,
    isActive: method.isActive, zone: method.zone?.id ?? '',
    // Ces 5 champs manquaient — sans eux, editingMethod repartait toujours
    // sur les valeurs par défaut du formulaire (methodType 'delivery',
    // champs pickup vides), même pour une méthode de type retrait existante.
    methodType: method.methodType ?? 'delivery',
    pickupAddress: method.pickupAddress ?? '',
    pickupHours: method.pickupHours ?? '',
    pickupInstructions: method.pickupInstructions ?? '',
    pickupPhone: method.pickupPhone ?? '',
  }
  methodDrawerOpen.value = true
}
async function onMethodSubmit(data: ShippingMethodFormData) {
  const success = methodMode.value === 'create'
    ? await store.createMethod(data)
    : await store.updateMethod(editingMethod.value!.id!, data)

  if (success) {
    methodDrawerOpen.value = false
    notify(methodMode.value === 'create' ? 'Methode creee avec succes.' : 'Methode mise a jour avec succes.', 'success')
  } else {
    notify('Une erreur est survenue, veuillez reessayer.', 'error')
  }
}

// -- Suppression
const deleteTarget = ref<{ type: 'zone' | 'method'; item: any } | null>(null)
async function confirmDelete() {
  if (!deleteTarget.value) return

  const { type, item } = deleteTarget.value
  const success = type === 'zone'
    ? await store.deleteZone(item.id)
    : await store.deleteMethod(item.id)

  deleteTarget.value = null

  if (success) {
    notify(type === 'zone' ? 'Zone supprimee avec succes.' : 'Methode supprimee avec succes.', 'success')
  } else {
    notify('Une erreur est survenue lors de la suppression.', 'error')
  }
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[{ label: 'Livraison', icon: 'solar:delivery-line-duotone' }]">
      <v-btn v-if="tab === 'zones'" color="secondary" variant="flat" rounded="xl" @click="openCreateZone">
        <Icon icon="solar:add-circle-line-duotone" width="20" style="margin-right: 6px;" />
        <span class="hide-mobile-text">Nouvelle zone</span>
      </v-btn>
      <v-btn v-else color="secondary" variant="flat" rounded="xl" @click="openCreateMethod">
        <Icon icon="solar:add-circle-line-duotone" width="20" style="margin-right: 6px;" />
        <span class="hide-mobile-text">Nouvelle methode</span>
      </v-btn>
    </UiBreadCrumbs>

    <div class="tabs-row">
      <v-btn-toggle v-model="tab" mandatory color="secondary" rounded="xl" density="comfortable" class="tabs">
        <v-btn value="zones">
          <Icon icon="solar:global-line-duotone" width="18" style="margin-right: 6px;" />
          Zones ({{ store.zones.length }})
        </v-btn>
        <v-btn value="methods">
          <Icon icon="solar:delivery-line-duotone" width="18" style="margin-right: 6px;" />
          Methodes ({{ store.methods.length }})
        </v-btn>
      </v-btn-toggle>

      <v-btn-toggle v-model="viewMode" mandatory density="comfortable" color="secondary" rounded="xl" class="hide-mobile">
        <v-btn value="table" size="small">
          <Icon icon="solar:list-line-duotone" width="18" />
        </v-btn>
        <v-btn value="cards" size="small">
          <Icon icon="solar:widget-2-line-duotone" width="18" />
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- Cards de synthèse — filtre rapide, uniquement pertinent sur les méthodes -->
    <div v-if="tab === 'methods'" class="summary-grid">
      <button
        class="summary-card" :class="{ active: filterStatus === 'active' }"
        @click="toggleStatusFilter('active')"
      >
        <v-sheet color="success" rounded="xl" class="summary-icon" variant="tonal">
          <Icon icon="solar:check-circle-line-duotone" width="20" />
        </v-sheet>
        <div>
          <div class="summary-value">{{ methodSummary.active }}</div>
          <div class="summary-label">Actives</div>
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
          <div class="summary-value">{{ methodSummary.inactive }}</div>
          <div class="summary-label">Inactives</div>
        </div>
      </button>
    </div>

    <!-- Recherche -->
    <div class="toolbar">
      <v-text-field
        v-model="search" variant="solo-filled" density="comfortable" flat hide-details rounded="xl"
        :placeholder="tab === 'zones' ? 'Rechercher une zone, un pays...' : 'Rechercher une methode, une zone...'"
        class="search-field"
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

    <!-- Zones -->
    <template v-else-if="tab === 'zones'">
      <div v-if="filteredZones.length === 0" class="empty-block">
        <Icon icon="solar:global-line-duotone" width="36" />
        <p>{{ store.zones.length === 0 ? 'Aucune zone de livraison.' : 'Aucun résultat pour cette recherche.' }}</p>
      </div>

      <template v-else>

        <!-- Table zones -->
        <div v-if="viewMode === 'table'" class="data-table hide-mobile">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Pays</th>
                <th>Methodes</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="zone in filteredZones" :key="zone.id">
                <td class="row-name">{{ zone.name }}</td>
                <td>
                  <div class="countries-row">
                    <v-chip v-for="c in zone.countries" :key="c" size="x-small" variant="tonal">{{ c }}</v-chip>
                  </div>
                </td>
                <td class="muted">{{ zone.methodsCount ?? 0 }} methode(s)</td>
                <td class="text-right">
                  <v-btn icon variant="text" size="36" @click="openEditZone(zone)">
                    <Icon icon="solar:pen-line-duotone" width="17" />
                  </v-btn>
                  <v-btn icon variant="text" size="36" @click="deleteTarget = { type: 'zone', item: zone }">
                    <Icon icon="solar:trash-bin-trash-line-duotone" width="17" style="color: #C0533E;" />
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards zones -->
        <div class="list-grid" :class="{ 'cards-hidden-desktop': viewMode === 'table' }">
          <div v-for="zone in filteredZones" :key="zone.id" class="list-card">
            <div class="list-card-info">
              <div class="list-card-name">{{ zone.name }}</div>
              <div class="countries-row">
                <v-chip v-for="c in zone.countries" :key="c" size="x-small" variant="tonal">{{ c }}</v-chip>
              </div>
              <div class="muted">{{ zone.methodsCount ?? 0 }} methode(s)</div>
            </div>
            <div class="list-card-actions">
              <v-btn icon variant="text" size="36" @click="openEditZone(zone)">
                <Icon icon="solar:pen-line-duotone" width="17" />
              </v-btn>
              <v-btn icon variant="text" size="36" @click="deleteTarget = { type: 'zone', item: zone }">
                <Icon icon="solar:trash-bin-trash-line-duotone" width="17" style="color: #C0533E;" />
              </v-btn>
            </div>
          </div>
        </div>

      </template>
    </template>

    <!-- Methodes -->
    <template v-else>
      <div v-if="filteredMethods.length === 0" class="empty-block">
        <Icon icon="solar:delivery-line-duotone" width="36" />
        <p>{{ store.methods.length === 0 ? 'Aucune methode de livraison.' : 'Aucun résultat pour ce filtre.' }}</p>
      </div>

      <template v-else>

        <!-- Table methodes -->
        <div v-if="viewMode === 'table'" class="data-table hide-mobile">
          <table>
            <thead>
              <tr>
                <th>Methode</th>
                <th>Zone</th>
                <th>Delai</th>
                <th class="text-right">Prix</th>
                <th>Statut</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="method in filteredMethods" :key="method.id">
                <td class="row-name">{{ method.name }}</td>
                <td class="muted">{{ method.zone?.name ?? '-' }}</td>
                <td class="muted">{{ method.minDays }}-{{ method.maxDays }}j</td>
                <td class="text-right method-price">{{ Number(method.price) === 0 ? 'Gratuite' : `${money(method.price)}€` }}</td>
                <td>
                  <span class="status-badge" :class="method.isActive ? 'active' : 'inactive'">
                    {{ method.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-right">
                  <v-btn icon variant="text" size="36" @click="openEditMethod(method)">
                    <Icon icon="solar:pen-line-duotone" width="17" />
                  </v-btn>
                  <v-btn icon variant="text" size="36" @click="deleteTarget = { type: 'method', item: method }">
                    <Icon icon="solar:trash-bin-trash-line-duotone" width="17" style="color: #C0533E;" />
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards methodes -->
        <div class="list-grid" :class="{ 'cards-hidden-desktop': viewMode === 'table' }">
          <div v-for="method in filteredMethods" :key="method.id" class="list-card">
            <div class="list-card-info">
              <div class="list-card-name">
                {{ method.name }}
                <span class="status-badge" :class="method.isActive ? 'active' : 'inactive'">
                  {{ method.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="muted">{{ method.zone?.name ?? '-' }} · {{ method.minDays }}-{{ method.maxDays }}j</div>
              <div class="method-price">
                <Icon icon="solar:wallet-money-line-duotone" width="14" style="margin-right: 4px;" />
                {{ Number(method.price) === 0 ? 'Gratuite' : `${money(method.price)}€` }}
              </div>
            </div>
            <div class="list-card-actions">
              <v-btn icon variant="text" size="36" @click="openEditMethod(method)">
                <Icon icon="solar:pen-line-duotone" width="17" />
              </v-btn>
              <v-btn icon variant="text" size="36" @click="deleteTarget = { type: 'method', item: method }">
                <Icon icon="solar:trash-bin-trash-line-duotone" width="17" style="color: #C0533E;" />
              </v-btn>
            </div>
          </div>
        </div>

      </template>
    </template>

    <AdminDrawerZone v-model="zoneDrawerOpen" :mode="zoneMode" :initial-data="editingZone" :saving="store.saving" @submit="onZoneSubmit" />
    <AdminDrawerMethod v-model="methodDrawerOpen" :mode="methodMode" :zones="store.zones" :initial-data="editingMethod" :saving="store.saving" @submit="onMethodSubmit" />

    <v-dialog v-model="deleteTarget" max-width="360">
      <v-card v-if="deleteTarget" rounded="xl" class="pa-2">
        <v-card-title class="text-body-1 font-weight-bold">Supprimer ?</v-card-title>
        <v-card-text class="text-body-2">
          "{{ deleteTarget.item.name }}" sera definitivement supprime. Cette action est irreversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteTarget = null">Annuler</v-btn>
          <v-btn color="error" variant="flat" rounded="xl" @click="confirmDelete">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<style scoped>
.hide-mobile { display: none; }
.hide-mobile-text { display: none; }

.tabs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.tabs { flex: 1; max-width: 340px; }
.tabs :deep(.v-btn) { flex: 1; }

.summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; max-width: 400px; }
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

.list-grid { display: flex; flex-direction: column; gap: 10px; }
.list-card {
  display: flex; align-items: center; justify-content: space-between;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-lg); padding: 14px 16px;
}
.list-card-info { flex: 1; min-width: 0; }
.list-card-name { font-size: 13.5px; font-weight: 700; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.countries-row { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
.muted { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); }
.method-price { display: flex; align-items: center; font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-secondary)); margin-top: 4px; }
.list-card-actions { display: flex; gap: 4px; flex-shrink: 0; }

.row-name { font-size: 13px; font-weight: 700; }

.status-badge { display: inline-flex; padding: 2px 9px; border-radius: var(--r-full); font-size: 10px; font-weight: 700; }
.status-badge.active   { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.status-badge.inactive { background: rgba(var(--v-theme-on-surface), 0.08); color: rgb(var(--v-theme-on-surface-variant)); }

@media (min-width: 960px) {
  .hide-mobile { display: flex; }
  .hide-mobile-text { display: inline; }

  .list-grid.cards-hidden-desktop { display: none; }

  .list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
  .list-card { flex-direction: column; align-items: stretch; }
  .list-card-actions { justify-content: flex-end; margin-top: 10px; }

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