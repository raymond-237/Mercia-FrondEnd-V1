<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useProductsStore } from '~/stores/Models/products.store'
import type { ProductCardData } from '~/types/public/index.type'

definePageMeta({ layout: 'admin' })

const productsStore = useProductsStore()

const products = ref<ProductCardData[]>([])
const loading  = ref(true)
const search   = ref('')
const activeFilter = ref<'all' | 'active' | 'low_stock' | 'out_of_stock'>('all')

const loadProducts = async () => {
  loading.value = true
  try {
    const data = await productsStore.fetchProducts({ search: search.value || undefined, include: 'medias,category' })
    products.value = data ?? []
  } catch (e) {
    console.error('Erreur chargement produits admin:', e)
    products.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadProducts)
watch(search, () => loadProducts())

// ── Cards de synthèse — cliquables, filtrent la table (pattern Pronoverse)

const summary = computed(() => ({
  all:          products.value.length,
  active:       products.value.filter(p => p.stockQuantity > p.lowStockThreshold).length,
  low_stock:    products.value.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length,
  out_of_stock: products.value.filter(p => p.stockQuantity === 0).length,
}))

const SUMMARY_CARDS = [
  { key: 'all' as const,          label: 'Total produits',    icon: 'solar:box-line-duotone',              color: 'secondary' },
  { key: 'active' as const,       label: 'En stock',           icon: 'solar:check-circle-line-duotone',     color: 'success' },
  { key: 'low_stock' as const,    label: 'Stock faible',       icon: 'solar:danger-triangle-line-duotone',  color: 'warning' },
  { key: 'out_of_stock' as const, label: 'Rupture de stock',   icon: 'solar:close-circle-line-duotone',     color: 'error' },
]

const filteredProducts = computed(() => {
  if (activeFilter.value === 'all') return products.value
  if (activeFilter.value === 'active')       return products.value.filter(p => p.stockQuantity > p.lowStockThreshold)
  if (activeFilter.value === 'low_stock')    return products.value.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold)
  return products.value.filter(p => p.stockQuantity === 0)
})

function toggleFilter(key: typeof activeFilter.value) {
  activeFilter.value = activeFilter.value === key ? 'all' : key
}

function stockStatus(p: ProductCardData): { label: string; class: string } {
  if (p.stockQuantity === 0) return { label: 'Rupture', class: 'out' }
  if (p.stockQuantity <= p.lowStockThreshold) return { label: 'Stock faible', class: 'low' }
  return { label: 'En stock', class: 'ok' }
}

// ── Menu actions par ligne
const menuOpenFor = ref<string | null>(null)
</script>

<template>
  <div>

    <!-- Header -->
    <section class="page-head">
      <div class="page-head-icon">
        <Icon icon="solar:box-line-duotone" width="24" />
      </div>
      <div class="page-head-text">
        <h1>Catalogue</h1>
        <p>{{ products.length }} produit{{ products.length > 1 ? 's' : '' }}</p>
      </div>
      <v-btn color="secondary" variant="flat" rounded="lg" size="large" class="add-btn" to="/admin/products/new">
        <Icon icon="solar:add-circle-line-duotone" width="18" style="margin-right: 6px;" />
        Ajouter un produit
      </v-btn>
    </section>

    <!-- Cards de synthèse — cliquables pour filtrer -->
    <div class="summary-grid">
      <button
        v-for="card in SUMMARY_CARDS"
        :key="card.key"
        class="summary-card"
        :class="{ active: activeFilter === card.key }"
        @click="toggleFilter(card.key)"
      >
        <v-sheet
          :color="card.color"
          rounded="lg"
          class="summary-icon"
          variant="tonal"
        >
          <Icon :icon="card.icon" width="20" />
        </v-sheet>
        <div>
          <div class="summary-value">{{ summary[card.key] }}</div>
          <div class="summary-label">{{ card.label }}</div>
        </div>
      </button>
    </div>

    <!-- Barre recherche -->
    <div class="toolbar">
      <v-text-field
        v-model="search"
        variant="solo-filled"
        density="comfortable"
        flat
        hide-details
        rounded="lg"
        placeholder="Rechercher un produit..."
        class="search-field"
      >
        <template #prepend-inner>
          <Icon icon="solar:magnifer-line-duotone" width="18" />
        </template>
      </v-text-field>
      <v-btn variant="tonal" color="surface-variant" rounded="lg" class="hide-mobile">
        <Icon icon="solar:filter-line-duotone" width="16" style="margin-right: 6px;" />
        Filtrer
      </v-btn>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <!-- Vide -->
    <div v-else-if="filteredProducts.length === 0" class="empty-block">
      <Icon icon="solar:box-minimalistic-line-duotone" width="36" />
      <p>Aucun produit trouvé.</p>
    </div>

    <!-- ── Table desktop ─────────────────────────────────────── -->
    <div v-else class="products-table hide-mobile">
      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th>Prix</th>
            <th>Stock</th>
            <th>Statut</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredProducts" :key="p.id">
            <td>
              <div class="product-cell">
                <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="product-thumb">
                <div v-else class="product-thumb placeholder">
                  <Icon icon="solar:box-line-duotone" width="18" />
                </div>
                <div>
                  <div class="product-name">{{ p.name }}</div>
                  <div class="product-variant">{{ p.variantName }}</div>
                </div>
              </div>
            </td>
            <td class="product-price">{{ p.price }}€</td>
            <td>{{ p.stockQuantity }}</td>
            <td>
              <span class="stock-badge" :class="stockStatus(p).class">{{ stockStatus(p).label }}</span>
            </td>
            <td class="text-right">
              <v-btn icon variant="text" size="36" :to="`/admin/products/${p.id}/edit`">
                <Icon icon="solar:pen-line-duotone" width="17" />
              </v-btn>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn icon variant="text" size="36" v-bind="props">
                    <Icon icon="solar:menu-dots-bold-duotone" width="17" />
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item>
                    <Icon icon="solar:eye-line-duotone" width="16" style="margin-right: 8px;" />
                    Voir sur la boutique
                  </v-list-item>
                  <v-list-item>
                    <Icon icon="solar:archive-line-duotone" width="16" style="margin-right: 8px;" />
                    Archiver
                  </v-list-item>
                  <v-list-item class="danger-item">
                    <Icon icon="solar:trash-bin-trash-line-duotone" width="16" style="margin-right: 8px;" />
                    Supprimer
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Cards mobile ─────────────────────────────────────── -->
    <div v-if="!loading && filteredProducts.length > 0" class="products-cards hide-desktop">
      <div v-for="p in filteredProducts" :key="p.id" class="product-card">
        <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="product-thumb">
        <div v-else class="product-thumb placeholder">
          <Icon icon="solar:box-line-duotone" width="20" />
        </div>

        <div class="product-card-info">
          <div class="product-name">{{ p.name }}</div>
          <div class="product-variant">{{ p.variantName }}</div>
          <div class="product-card-meta">
            <span class="product-price">{{ p.price }}€</span>
            <span class="stock-badge" :class="stockStatus(p).class">{{ stockStatus(p).label }}</span>
          </div>
        </div>

        <v-menu>
          <template #activator="{ props }">
            <v-btn icon variant="text" size="36" v-bind="props">
              <Icon icon="solar:menu-dots-bold-duotone" width="17" />
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item :to="`/admin/products/${p.id}/edit`">
              <Icon icon="solar:pen-line-duotone" width="16" style="margin-right: 8px;" />
              Modifier
            </v-list-item>
            <v-list-item>
              <Icon icon="solar:eye-line-duotone" width="16" style="margin-right: 8px;" />
              Voir sur la boutique
            </v-list-item>
            <v-list-item>
              <Icon icon="solar:archive-line-duotone" width="16" style="margin-right: 8px;" />
              Archiver
            </v-list-item>
            <v-list-item class="danger-item">
              <Icon icon="solar:trash-bin-trash-line-duotone" width="16" style="margin-right: 8px;" />
              Supprimer
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- FAB mobile — ajouter un produit -->
    <v-btn
      icon size="56" color="secondary" variant="flat"
      class="fab-add hide-desktop"
      to="/admin/products/new"
      elevation="4"
    >
      <Icon icon="solar:add-circle-bold-duotone" width="26" />
    </v-btn>

  </div>
</template>

<style scoped>
/* ── Mobile first ─────────────────────────────────────────── */

.hide-desktop { display: block; }
.hide-mobile  { display: none; }

.page-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.page-head-icon {
  width: 44px; height: 44px; border-radius: var(--r-lg);
  background: rgba(var(--v-theme-secondary), 0.12);
  color: rgb(var(--v-theme-secondary));
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.page-head-text h1 { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; }
.page-head-text p { font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); }
.add-btn { display: none; margin-left: auto; }

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
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
.empty-block p { font-size: 13px; }

/* Cards mobile */
.products-cards { display: flex; flex-direction: column; gap: 10px; }
.product-card {
  display: flex; align-items: center; gap: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-lg);
  padding: 12px;
}
.product-card-info { flex: 1; min-width: 0; }
.product-card-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; }

.product-thumb {
  width: 48px; height: 48px; border-radius: var(--r-md);
  object-fit: cover; flex-shrink: 0;
  background: rgb(var(--v-theme-surface-variant));
}
.product-thumb.placeholder {
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-on-surface-variant));
}
.product-name { font-size: 13.5px; font-weight: 700; }
.product-variant { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); }
.product-price { font-size: 13px; font-weight: 700; }

.stock-badge {
  display: inline-flex; padding: 3px 9px; border-radius: var(--r-full);
  font-size: 10.5px; font-weight: 700;
}
.stock-badge.ok  { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.stock-badge.low { background: rgba(217, 164, 65, 0.15); color: #B8862F; }
.stock-badge.out { background: rgba(192, 83, 62, 0.12); color: #C0533E; }

.fab-add {
  position: fixed; bottom: 24px; right: 20px; z-index: 50;
}

.danger-item { color: #C0533E; }

/* ── Desktop ─────────────────────────────────────────────── */
@media (min-width: 960px) {
  .hide-desktop { display: none; }
  .hide-mobile  { display: flex; }

  .page-head-text h1 { font-size: 24px; }
  .add-btn { display: flex; }

  .summary-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .summary-card { padding: 16px; }
  .summary-icon { width: 42px; height: 42px; }
  .summary-value { font-size: 22px; }

  .products-table {
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
    border-radius: var(--r-xl);
    overflow: hidden;
  }
  .products-table table { width: 100%; border-collapse: collapse; }
  .products-table th {
    text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant));
    padding: 14px 18px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  }
  .products-table td {
    padding: 14px 18px; font-size: 13px;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
  }
  .products-table tr:last-child td { border-bottom: none; }
  .products-table .text-right { text-align: right; white-space: nowrap; }

  .product-cell { display: flex; align-items: center; gap: 12px; }

  .fab-add { display: none; }
}
</style>