<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { notify } from '~/@cores/constantes/helpers'
import { useCategoriesStore } from '~/stores/Models/category.store'
import type { CategoryFormData } from '~/types/Models/category.type'

definePageMeta({ layout: 'admin' })

const categoriesStore = useCategoriesStore()
const search    = ref('')
const viewMode  = ref<'table' | 'cards'>('table')
const filterOpen = ref(false)

// ── Filtres offcanvas
const filterStatus   = ref<'all' | 'active' | 'inactive'>('all')
const filterSort     = ref<'name' | '-name' | 'position'>('name')
const filterHierarchy = ref<'all' | 'roots' | 'children'>('all')

const STATUS_OPTIONS = [
  { title: 'Toutes', value: 'all' },
  { title: 'Actives', value: 'active' },
  { title: 'Masquées', value: 'inactive' },
]
const SORT_OPTIONS = [
  { title: 'Nom (A → Z)', value: 'name' },
  { title: 'Nom (Z → A)', value: '-name' },
  { title: 'Position', value: 'position' },
]
const HIERARCHY_OPTIONS = [
  { title: 'Toutes', value: 'all' },
  { title: 'Catégories racines', value: 'roots' },
  { title: 'Sous-catégories', value: 'children' },
]

onMounted(() => categoriesStore.fetchCategories())

// Résout le nom du parent — utilisé dans le tableau, les cartes, et le
// dialog de suppression, pour ne jamais afficher juste un UUID à l'admin.
function parentName(cat: any): string | null {
  if (!cat.parentId) return null
  return categoriesStore.categories.find(c => c.id === cat.parentId)?.name ?? null
}

function hasChildren(categoryId: string): boolean {
  return categoriesStore.categories.some(c => c.parentId === categoryId)
}

const filteredCategories = computed(() => {
  let list = categoriesStore.categories

  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q))
  }

  if (filterStatus.value === 'active')   list = list.filter(c => c.isActive)
  if (filterStatus.value === 'inactive') list = list.filter(c => !c.isActive)

  if (filterHierarchy.value === 'roots')    list = list.filter(c => !c.parentId)
  if (filterHierarchy.value === 'children') list = list.filter(c => !!c.parentId)

  const sorted = [...list]
  if (filterSort.value === 'name')      sorted.sort((a, b) => a.name.localeCompare(b.name))
  if (filterSort.value === '-name')     sorted.sort((a, b) => b.name.localeCompare(a.name))
  if (filterSort.value === 'position')  sorted.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  return sorted
})

const activeFilterCount = computed(() =>
  (filterStatus.value !== 'all' ? 1 : 0) +
  (filterSort.value !== 'name' ? 1 : 0) +
  (filterHierarchy.value !== 'all' ? 1 : 0)
)

function resetFilters() {
  filterStatus.value    = 'all'
  filterSort.value       = 'name'
  filterHierarchy.value  = 'all'
  filterOpen.value       = false
}

// ── Drawer création/édition
const drawerOpen = ref(false)
const drawerMode  = ref<'create' | 'edit'>('create')
const editingCategory = ref<(Partial<CategoryFormData> & { id?: string }) | undefined>()

function openCreate() {
  drawerMode.value = 'create'
  editingCategory.value = undefined
  drawerOpen.value = true
}
function openEdit(category: any) {
  drawerMode.value = 'edit'
  editingCategory.value = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    metaTitle: category.metaTitle ?? '',
    metaDescription: category.metaDescription ?? '',
    isActive: category.isActive ?? true,
    position: category.position ?? 0,
    parentId: category.parentId ?? null,
  }
  drawerOpen.value = true
}

async function onSubmit(data: CategoryFormData) {
  const success = drawerMode.value === 'create'
    ? await categoriesStore.createCategory(data)
    : await categoriesStore.updateCategory(editingCategory.value!.id!, data)

  if (success) {
    notify({
      message: "Action effectuée avec succès",
      color: "success",
      timeout: 2000
    })
    drawerOpen.value = false
  }
}

// ── Suppression
const deleteTarget = ref<any>(null)
const deleteTargetHasChildren = computed(() => deleteTarget.value ? hasChildren(deleteTarget.value.id) : false)

async function confirmDelete() {
  if (!deleteTarget.value) return
  await categoriesStore.deleteCategory(deleteTarget.value.id)
  deleteTarget.value = null
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[
      { label: 'Produits', icon: 'solar:box-line-duotone', to: '/backoffice/products' },
      { label: 'Catégories' },
    ]">
      <v-btn color="secondary" variant="flat" rounded="xl" @click="openCreate">
        <Icon icon="solar:add-circle-line-duotone" width="18" style="margin-right: 6px;" />
        <span class="hide-mobile-text">Nouvelle catégorie</span>
      </v-btn>
    </UiBreadCrumbs>

    <!-- Toolbar -->
    <div class="toolbar">
      <v-text-field
        v-model="search"
        variant="solo-filled" density="comfortable" flat hide-details rounded="xl"
        placeholder="Rechercher une catégorie..."
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
    <div v-if="categoriesStore.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <!-- Vide -->
    <div v-else-if="filteredCategories.length === 0" class="empty-block">
      <Icon icon="solar:folder-line-duotone" width="36" />
      <p>Aucune catégorie trouvée.</p>
    </div>

    <!-- ── Table (desktop + viewMode=table) ─────────────────── -->
    <div v-else-if="viewMode === 'table'" class="categories-table hide-mobile">
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Parent</th>
            <th>Slug</th>
            <th>Produits</th>
            <th>Statut</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in filteredCategories" :key="cat.id">
            <td class="cat-name">{{ cat.name }}</td>
            <td>
              <span v-if="parentName(cat)" class="parent-chip">{{ parentName(cat) }}</span>
              <span v-else class="root-chip">Racine</span>
            </td>
            <td class="muted">{{ cat.slug }}</td>
            <td>{{ cat.productCount ?? 0 }}</td>
            <td>
              <span class="status-badge" :class="cat.isActive ? 'active' : 'inactive'">
                {{ cat.isActive ? 'Active' : 'Masquée' }}
              </span>
            </td>
            <td class="text-right">
              <v-btn icon variant="text" size="36" @click="openEdit(cat)">
                <Icon icon="solar:pen-line-duotone" width="17" />
              </v-btn>
              <v-btn icon variant="text" size="36" @click="deleteTarget = cat">
                <Icon icon="solar:trash-bin-trash-line-duotone" width="17" style="color: #C0533E;" />
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Cards (desktop, viewMode=cards) ───────────────────── -->
    <div v-if="!categoriesStore.loading && filteredCategories.length > 0 && viewMode === 'cards'" class="categories-cards-grid hide-mobile">
      <div v-for="cat in filteredCategories" :key="cat.id" class="category-grid-card">
        <div class="grid-card-head">
          <span class="status-badge" :class="cat.isActive ? 'active' : 'inactive'">
            {{ cat.isActive ? 'Active' : 'Masquée' }}
          </span>
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn icon variant="text" size="32" v-bind="menuProps">
                <Icon icon="solar:menu-dots-bold-duotone" width="16" />
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item @click="openEdit(cat)">
                <Icon icon="solar:pen-line-duotone" width="16" style="margin-right: 8px;" />
                Modifier
              </v-list-item>
              <v-list-item class="danger-item" @click="deleteTarget = cat">
                <Icon icon="solar:trash-bin-trash-line-duotone" width="16" style="margin-right: 8px;" />
                Supprimer
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
        <div class="cat-name">{{ cat.name }}</div>
        <span v-if="parentName(cat)" class="parent-chip">{{ parentName(cat) }}</span>
        <span v-else class="root-chip">Racine</span>
        <div class="muted mt-2">{{ cat.slug }}</div>
        <div class="grid-card-meta">{{ cat.productCount ?? 0 }} produit(s)</div>
      </div>
    </div>

    <!-- Cards mobile — toujours, peu importe viewMode -->
    <div v-if="!categoriesStore.loading && filteredCategories.length > 0" class="categories-cards hide-desktop">
      <div v-for="cat in filteredCategories" :key="cat.id" class="category-card">
        <div class="category-info">
          <div class="cat-name">
            {{ cat.name }}
            <span class="status-badge" :class="cat.isActive ? 'active' : 'inactive'">
              {{ cat.isActive ? 'Active' : 'Masquée' }}
            </span>
          </div>
          <div class="category-meta">
            <span v-if="parentName(cat)" class="parent-chip">{{ parentName(cat) }}</span>
            <span v-else class="root-chip">Racine</span>
            · {{ cat.productCount ?? 0 }} produit(s)
          </div>
        </div>
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn icon variant="text" size="36" v-bind="menuProps">
              <Icon icon="solar:menu-dots-bold-duotone" width="17" />
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="openEdit(cat)">
              <Icon icon="solar:pen-line-duotone" width="16" style="margin-right: 8px;" />
              Modifier
            </v-list-item>
            <v-list-item class="danger-item" @click="deleteTarget = cat">
              <Icon icon="solar:trash-bin-trash-line-duotone" width="16" style="margin-right: 8px;" />
              Supprimer
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <AdminCategoryDrawer
      v-model="drawerOpen"
      :mode="drawerMode"
      :initial-data="editingCategory"
      :saving="categoriesStore.saving"
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

          <label class="filter-label">Hiérarchie</label>
          <v-select
            v-model="filterHierarchy" :items="HIERARCHY_OPTIONS"
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
        <v-card-title class="text-body-1 font-weight-bold">Supprimer cette catégorie ?</v-card-title>
        <v-card-text class="text-body-2">
          "{{ deleteTarget.name }}" sera définitivement supprimée. Cette action est irréversible.
          <div v-if="deleteTargetHasChildren" class="children-warning">
            <Icon icon="solar:danger-triangle-line-duotone" width="16" />
            Cette catégorie a des sous-catégories — elles deviendront des catégories racines, pas supprimées avec elle.
          </div>
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
.hide-desktop { display: block; }
.hide-mobile  { display: none; }
.hide-mobile-text { display: none; }

.toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
.search-field { flex: 1; }

.loading-block, .empty-block {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px 0; color: rgb(var(--v-theme-on-surface-variant));
}

.parent-chip {
  display: inline-flex; padding: 3px 10px; border-radius: var(--r-full);
  font-size: 10px; font-weight: 700;
  background: rgba(var(--v-theme-secondary), 0.1); color: rgb(var(--v-theme-secondary));
}
.root-chip {
  display: inline-flex; padding: 3px 10px; border-radius: var(--r-full);
  font-size: 10px; font-weight: 700;
  background: rgba(var(--v-theme-on-surface), 0.06); color: rgb(var(--v-theme-on-surface-variant));
}

.children-warning {
  display: flex; align-items: flex-start; gap: 8px;
  background: rgba(var(--v-theme-warning), 0.1);
  border-radius: var(--r-lg); padding: 10px 12px; margin-top: 12px;
  font-size: 12px; color: rgb(var(--v-theme-on-surface));
}
.children-warning :deep(svg) { flex-shrink: 0; margin-top: 1px; color: rgb(var(--v-theme-warning)); }

/* Cards mobile (toujours) */
.categories-cards { display: flex; flex-direction: column; gap: 10px; }
.category-card {
  display: flex; align-items: center; justify-content: space-between;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-lg); padding: 14px 16px;
}
.category-info { flex: 1; min-width: 0; }
.cat-name { font-size: 13.5px; font-weight: 700; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.category-meta { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.muted { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.status-badge { display: inline-flex; padding: 3px 10px; border-radius: var(--r-full); font-size: 10px; font-weight: 700; }
.status-badge.active   { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.status-badge.inactive { background: rgba(var(--v-theme-on-surface), 0.08); color: rgb(var(--v-theme-on-surface-variant)); }

.danger-item { color: #C0533E; }

/* Filter drawer */
.filter-drawer { display: flex; flex-direction: column; height: 100%; padding: 20px; }
.filter-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.filter-head h3 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; }
.filter-body { flex: 1; }
.filter-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 8px; }
.filter-foot { display: flex; gap: 10px; padding-top: 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }

/* ── Desktop  */
@media (min-width: 960px) {
  .hide-desktop { display: none; }
  .hide-mobile  { display: flex; }
  .hide-mobile-text { display: inline; }

  .categories-table {
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
    border-radius: var(--r-xl);
    overflow: hidden;
  }
  .categories-table table { width: 100%; border-collapse: collapse; }
  .categories-table th {
    text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant));
    padding: 14px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  }
  .categories-table td { padding: 14px 18px; font-size: 13px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
  .categories-table tr:last-child td { border-bottom: none; }
  .categories-table .text-right { text-align: right; white-space: nowrap; }

  .categories-cards-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;
  }
  .category-grid-card {
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
    border-radius: var(--r-xl); padding: 16px;
  }
  .grid-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .grid-card-meta { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 6px; }
}
</style>