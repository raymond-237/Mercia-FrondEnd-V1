<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useSuppliersStore } from '~/stores/Models/supplier.store'
import type { Supplier, SupplierFormData } from '~/services/Models/suppliers.service'

definePageMeta({ layout: 'admin' })

const store = useSuppliersStore()
const search    = ref('')
const viewMode  = ref<'table' | 'cards'>('table')
const filterOpen = ref(false)

// ── Filtres offcanvas
const filterStatus = ref<'all' | 'active' | 'inactive'>('all')
const filterSort    = ref<'name' | '-name'>('name')

const STATUS_OPTIONS = [
  { title: 'Tous', value: 'all' },
  { title: 'Actifs', value: 'active' },
  { title: 'Inactifs', value: 'inactive' },
]
const SORT_OPTIONS = [
  { title: 'Nom (A → Z)', value: 'name' },
  { title: 'Nom (Z → A)', value: '-name' },
]

onMounted(() => store.fetchSuppliers())
watch(search, (v) => store.fetchSuppliers(v || undefined))

const filteredSuppliers = computed(() => {
  let list = store.suppliers

  if (filterStatus.value === 'active')   list = list.filter(s => s.isActive)
  if (filterStatus.value === 'inactive') list = list.filter(s => !s.isActive)

  const sorted = [...list]
  if (filterSort.value === 'name')  sorted.sort((a, b) => a.name.localeCompare(b.name))
  if (filterSort.value === '-name') sorted.sort((a, b) => b.name.localeCompare(a.name))

  return sorted
})

const activeFilterCount = computed(() =>
  (filterStatus.value !== 'all' ? 1 : 0) + (filterSort.value !== 'name' ? 1 : 0)
)

function resetFilters() {
  filterStatus.value = 'all'
  filterSort.value    = 'name'
  filterOpen.value    = false
}

// ── Drawer création/édition
const drawerOpen = ref(false)
const drawerMode  = ref<'create' | 'edit'>('create')
const editingSupplier = ref<Supplier | undefined>()

function openCreate() {
  drawerMode.value = 'create'
  editingSupplier.value = undefined
  drawerOpen.value = true
}
function openEdit(supplier: Supplier) {
  drawerMode.value = 'edit'
  editingSupplier.value = supplier
  drawerOpen.value = true
}

async function onSubmit(data: SupplierFormData) {
  const success = drawerMode.value === 'create'
    ? await store.createSupplier(data)
    : await store.updateSupplier(editingSupplier.value!.id, data)

  if (success) {
    notify({ message: 'Action effectuée avec succès', color: 'success', timeout: 2000 })
    drawerOpen.value = false
  } else {
    notify({ message: store.error ?? 'Une erreur est survenue.', color: 'error', timeout: 3500 })
  }
}

// ── Suppression
const deleteTarget = ref<Supplier | null>(null)
async function confirmDelete() {
  if (!deleteTarget.value) return
  const success = await store.deleteSupplier(deleteTarget.value.id)
  if (!success) {
    notify({ message: store.error ?? "Impossible de supprimer.", color: 'error', timeout: 4000 })
  }
  deleteTarget.value = null
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[{ label: 'Fournisseurs', icon: 'solar:box-line-duotone' }]">
      <v-btn color="secondary" variant="flat" rounded="xl" @click="openCreate">
        <Icon icon="solar:add-circle-line-duotone" width="18" style="margin-right: 6px;" />
        <span class="hide-mobile-text">Nouveau fournisseur</span>
      </v-btn>
    </UiBreadCrumbs>

    <!-- Toolbar -->
    <div class="toolbar">
      <v-text-field
        v-model="search"
        variant="solo-filled" density="comfortable" flat hide-details rounded="xl"
        placeholder="Rechercher un fournisseur..."
        class="search-field"
      >
        <template #prepend-inner><Icon icon="solar:magnifer-line-duotone" width="18" /></template>
      </v-text-field>

      <v-btn variant="tonal" color="secondary" rounded="xl" @click="filterOpen = true">
        <Icon icon="solar:tuning-2-line-duotone" width="18" style="margin-right: 6px;" />
        Filtrer
        <v-chip v-if="activeFilterCount" size="x-small" color="secondary" class="ml-2">{{ activeFilterCount }}</v-chip>
      </v-btn>

      <v-btn-toggle v-model="viewMode" mandatory density="comfortable" color="secondary" rounded="xl" class="hide-mobile">
        <v-btn value="table" size="small"><Icon icon="solar:list-line-duotone" width="18" /></v-btn>
        <v-btn value="cards" size="small"><Icon icon="solar:widget-2-line-duotone" width="18" /></v-btn>
      </v-btn-toggle>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <!-- Vide -->
    <div v-else-if="filteredSuppliers.length === 0" class="empty-block">
      <Icon icon="solar:box-line-duotone" width="36" />
      <p>Aucun fournisseur trouvé.</p>
    </div>

    <!-- ── Table (desktop + viewMode=table) ─────────────────── -->
    <div v-else-if="viewMode === 'table'" class="suppliers-table hide-mobile">
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Contact</th>
            <th>Pays</th>
            <th>Produits</th>
            <th>Statut</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filteredSuppliers" :key="s.id">
            <td class="sup-name">{{ s.name }}</td>
            <td class="muted">{{ s.contactName ?? s.email ?? '—' }}</td>
            <td class="muted">{{ s.country ?? '—' }}</td>
            <td>{{ s.productsCount }}</td>
            <td>
              <span class="status-badge" :class="s.isActive ? 'active' : 'inactive'">
                {{ s.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="text-right">
              <v-btn icon variant="text" size="36" @click="openEdit(s)">
                <Icon icon="solar:pen-line-duotone" width="17" />
              </v-btn>
              <v-btn icon variant="text" size="36" @click="deleteTarget = s">
                <Icon icon="solar:trash-bin-trash-line-duotone" width="17" style="color: #C0533E;" />
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Cards (desktop, viewMode=cards) ───────────────────── -->
    <div v-if="!store.loading && filteredSuppliers.length > 0 && viewMode === 'cards'" class="suppliers-cards-grid hide-mobile">
      <div v-for="s in filteredSuppliers" :key="s.id" class="supplier-grid-card">
        <div class="grid-card-head">
          <span class="status-badge" :class="s.isActive ? 'active' : 'inactive'">
            {{ s.isActive ? 'Actif' : 'Inactif' }}
          </span>
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn icon variant="text" size="32" v-bind="menuProps">
                <Icon icon="solar:menu-dots-bold-duotone" width="16" />
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item @click="openEdit(s)">
                <Icon icon="solar:pen-line-duotone" width="16" style="margin-right: 8px;" />
                Modifier
              </v-list-item>
              <v-list-item class="danger-item" @click="deleteTarget = s">
                <Icon icon="solar:trash-bin-trash-line-duotone" width="16" style="margin-right: 8px;" />
                Supprimer
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
        <div class="sup-name">{{ s.name }}</div>
        <div v-if="s.contactName" class="muted">{{ s.contactName }}</div>
        <div class="grid-card-meta">{{ s.productsCount }} produit(s){{ s.country ? ` · ${s.country}` : '' }}</div>
      </div>
    </div>

    <!-- Cards mobile — toujours, peu importe viewMode -->
    <div v-if="!store.loading && filteredSuppliers.length > 0" class="suppliers-cards hide-desktop">
      <div v-for="s in filteredSuppliers" :key="s.id" class="supplier-card">
        <div class="supplier-info">
          <div class="sup-name">
            {{ s.name }}
            <span class="status-badge" :class="s.isActive ? 'active' : 'inactive'">
              {{ s.isActive ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          <div class="supplier-meta">{{ s.productsCount }} produit(s){{ s.country ? ` · ${s.country}` : '' }}</div>
        </div>
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn icon variant="text" size="36" v-bind="menuProps">
              <Icon icon="solar:menu-dots-bold-duotone" width="17" />
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="openEdit(s)">
              <Icon icon="solar:pen-line-duotone" width="16" style="margin-right: 8px;" />
              Modifier
            </v-list-item>
            <v-list-item class="danger-item" @click="deleteTarget = s">
              <Icon icon="solar:trash-bin-trash-line-duotone" width="16" style="margin-right: 8px;" />
              Supprimer
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <AdminDrawerSupplier
      v-model="drawerOpen"
      :mode="drawerMode"
      :initial-data="editingSupplier"
      :saving="store.saving"
      @submit="onSubmit"
    />

    <!-- Offcanvas filtres -->
    <v-navigation-drawer v-model="filterOpen" temporary location="right" width="320">
      <div class="filter-drawer">
        <div class="filter-head">
          <h3>Filtrer</h3>
          <v-btn icon color="error" variant="text" size="36" @click="filterOpen = false">
            <Icon icon="solar:close-circle-line-duotone" width="30" />
          </v-btn>
        </div>

        <div class="filter-body">
          <label class="filter-label">Statut</label>
          <v-select
            v-model="filterStatus" :items="STATUS_OPTIONS"
            variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-4"
          />

          <label class="filter-label">Trier par</label>
          <v-select
            v-model="filterSort" :items="SORT_OPTIONS"
            variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-4"
          />
        </div>

        <div class="filter-foot mx-auto">
          <v-btn variant="tonal" color="secondary" rounded="xl" @click="resetFilters">
            Réinitialiser
          </v-btn>
          <v-btn color="secondary" variant="flat" rounded="xl" @click="filterOpen = false">
            Appliquer
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- Confirmation suppression -->
    <v-dialog v-model="deleteTarget" max-width="380">
      <v-card v-if="deleteTarget" rounded="xl" class="pa-2">
        <v-card-title class="text-body-1 font-weight-bold">Supprimer « {{ deleteTarget.name }} » ?</v-card-title>
        <v-card-text class="text-body-2">
          Cette action est irréversible. Impossible si des produits y sont encore rattachés.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteTarget = null">Annuler</v-btn>
          <v-btn color="error" variant="flat" rounded="xl" :loading="store.saving" @click="confirmDelete">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<style scoped>
.hide-desktop { display: block; }
.hide-mobile  { display: none; }
.hide-mobile-text { display: none; }

.toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
.search-field { flex: 1; }

.loading-block, .empty-block {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px 0; color: rgb(var(--v-theme-on-surface-variant));
}

.suppliers-cards { display: flex; flex-direction: column; gap: 10px; }
.supplier-card {
  display: flex; align-items: center; justify-content: space-between;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-lg); padding: 14px 16px;
}
.supplier-info { flex: 1; min-width: 0; }
.sup-name { font-size: 13.5px; font-weight: 700; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.supplier-meta { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }
.muted { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.status-badge { display: inline-flex; padding: 3px 10px; border-radius: var(--r-full); font-size: 10px; font-weight: 700; }
.status-badge.active   { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.status-badge.inactive { background: rgba(var(--v-theme-on-surface), 0.08); color: rgb(var(--v-theme-on-surface-variant)); }

.danger-item { color: #C0533E; }

.filter-drawer { display: flex; flex-direction: column; height: 100%; padding: 20px; }
.filter-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.filter-head h3 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; }
.filter-body { flex: 1; }
.filter-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 8px; }
.filter-foot { display: flex; gap: 10px; padding-top: 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }

@media (min-width: 960px) {
  .hide-desktop { display: none; }
  .hide-mobile  { display: flex; }
  .hide-mobile-text { display: inline; }

  .suppliers-table {
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
    border-radius: var(--r-xl);
    overflow: hidden;
  }
  .suppliers-table table { width: 100%; border-collapse: collapse; }
  .suppliers-table th {
    text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant));
    padding: 14px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  }
  .suppliers-table td { padding: 14px 18px; font-size: 13px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
  .suppliers-table tr:last-child td { border-bottom: none; }
  .suppliers-table .text-right { text-align: right; white-space: nowrap; }

  .suppliers-cards-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;
  }
  .supplier-grid-card {
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
    border-radius: var(--r-xl); padding: 16px;
  }
  .grid-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .grid-card-meta { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 6px; }
}
</style>