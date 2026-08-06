<script setup lang="ts">
import { useCategoriesStore } from '~/stores/Models/category.store'
import { useProductsStore } from '~/stores/Models/products.store'
import type { ProductCardData } from '~/types/public/index.type'

definePageMeta({ layout: 'admin' })

const productsStore   = useProductsStore()
const categoriesStore = useCategoriesStore()
const router          = useRouter()

const products    = ref<ProductCardData[]>([])
const loading     = ref(true)
const search      = ref('')
const viewMode    = ref<'table' | 'cards'>('cards')
const filterOpen  = ref(false)

const filterCategory = ref<string | null>(null)
const filterSort      = ref('name')

const CATEGORY_OPTIONS = computed(() => [
  { title: 'Toutes les catégories', value: null },
  ...categoriesStore.categories.map(c => ({ title: c.name, value: c.id })),
])

const SORT_OPTIONS = [
  { title: 'Nom (A → Z)',        value: 'name' },
  { title: 'Nom (Z → A)',        value: '-name' },
  { title: 'Prix croissant',     value: 'price' },
  { title: 'Prix décroissant',   value: '-price' },
  { title: 'Plus récents',       value: '-createdAt' },
]

const filterStock = ref<'all' | 'active' | 'low_stock' | 'out_of_stock'>('all')

const currentPage = ref(1)
const totalPages  = ref(1)

const loadProducts = async () => {
  loading.value = true
  try {
    const data = await productsStore.fetchProducts({
      search:   search.value || undefined,
      category: filterCategory.value || undefined,
      sort:     filterSort.value,
      page:     currentPage.value,
      include:  'medias,category,productVariants.inventory',
    })
    products.value    = data ?? []
    totalPages.value  = productsStore.pagination?.lastPage ?? 1
  } catch (e) {
    console.error('Erreur chargement produits admin:', e)
    products.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProducts()
  if (!categoriesStore.categories.length) categoriesStore.fetchCategories()
})
watch(search, () => { currentPage.value = 1; loadProducts() })
watch(currentPage, loadProducts)

function applyFilters() {
  currentPage.value = 1
  filterOpen.value  = false
  loadProducts()
}
function resetFilters() {
  filterCategory.value = null
  filterSort.value      = 'name'
  applyFilters()
}
function clearSearch() {
  search.value = ''
}

const summary = computed(() => ({
  all:          products.value.length,
  active:       products.value.filter(p => p.stockQuantity > p.lowStockThreshold).length,
  low_stock:    products.value.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length,
  out_of_stock: products.value.filter(p => p.stockQuantity === 0).length,
}))
const SUMMARY_CARDS = [
  { key: 'all' as const,          label: 'Total (page)',     icon: 'solar:box-line-duotone',             color: 'secondary' },
  { key: 'active' as const,       label: 'En stock',          icon: 'solar:check-circle-line-duotone',    color: 'success' },
  { key: 'low_stock' as const,    label: 'Stock faible',      icon: 'solar:danger-triangle-line-duotone', color: 'warning' },
  { key: 'out_of_stock' as const, label: 'Rupture',           icon: 'solar:close-circle-line-duotone',    color: 'error' },
]

const filteredProducts = computed(() => {
  if (filterStock.value === 'all') return products.value
  if (filterStock.value === 'active')    return products.value.filter(p => p.stockQuantity > p.lowStockThreshold)
  if (filterStock.value === 'low_stock') return products.value.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold)
  return products.value.filter(p => p.stockQuantity === 0)
})

function toggleStockFilter(key: typeof filterStock.value) {
  filterStock.value = filterStock.value === key ? 'all' : key
}

function stockStatus(p: ProductCardData): { label: string; class: string } {
  if (p.stockQuantity === 0) return { label: 'Rupture', class: 'out' }
  if (p.stockQuantity <= p.lowStockThreshold) return { label: 'Stock faible', class: 'low' }
  return { label: 'En stock', class: 'ok' }
}

const activeFilterCount = computed(() =>
  (filterCategory.value ? 1 : 0) + (filterSort.value !== 'name' ? 1 : 0),
)

function getImages(p: ProductCardData): string[] {
  const anyP = p as any
  if (Array.isArray(anyP.images) && anyP.images.length) return anyP.images
  return p.imageUrl ? [p.imageUrl] : []
}

// ── Navigation vers le détail back-office — déclenchée par un clic
// n'importe où sur la card, sauf sur les zones interactives (image,
// flèches/points du carousel, bouton modifier, menu actions).
function goToDetail(p: ProductCardData) {
  router.push(`/backoffice/products/${p.id}`)
}

// ── Mini-carousel par card
const cardIndex = reactive<Record<string, number>>({})
function getCardIndex(p: ProductCardData) {
  return cardIndex[p.id] ?? 0
}
function prevImage(p: ProductCardData, e: Event) {
  e.stopPropagation()
  e.preventDefault()
  const total = getImages(p).length
  cardIndex[p.id] = (getCardIndex(p) - 1 + total) % total
}
function nextImage(p: ProductCardData, e: Event) {
  e.stopPropagation()
  e.preventDefault()
  const total = getImages(p).length
  cardIndex[p.id] = (getCardIndex(p) + 1) % total
}
function setCardIndex(p: ProductCardData, i: number, e: Event) {
  e.stopPropagation()
  cardIndex[p.id] = i
}

const touchStartX = ref(0)
function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX
}
function onTouchEnd(p: ProductCardData, e: TouchEvent) {
  const delta = e.changedTouches[0].clientX - touchStartX.value
  if (Math.abs(delta) < 40) return
  const total = getImages(p).length
  if (total <= 1) return
  if (delta < 0) cardIndex[p.id] = (getCardIndex(p) + 1) % total
  else cardIndex[p.id] = (getCardIndex(p) - 1 + total) % total
}

// ── Lightbox
const lightboxOpen    = ref(false)
const lightboxProduct = ref<ProductCardData | null>(null)
const lightboxIndex   = ref(0)

const lightboxImages = computed(() => lightboxProduct.value ? getImages(lightboxProduct.value) : [])

function openLightbox(p: ProductCardData, startIndex = 0, e?: Event) {
  e?.stopPropagation()
  if (!getImages(p).length) return
  lightboxProduct.value = p
  lightboxIndex.value   = startIndex
  lightboxOpen.value    = true
}
function lightboxPrev() {
  const total = lightboxImages.value.length
  lightboxIndex.value = (lightboxIndex.value - 1 + total) % total
}
function lightboxNext() {
  const total = lightboxImages.value.length
  lightboxIndex.value = (lightboxIndex.value + 1) % total
}
function onKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'ArrowLeft') lightboxPrev()
  if (e.key === 'ArrowRight') lightboxNext()
  if (e.key === 'Escape') lightboxOpen.value = false
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[{ label: 'Produits', icon: 'solar:box-line-duotone' }]">
      <v-btn color="secondary" variant="flat" rounded="xl" to="/backoffice/products/new">
        <Icon icon="solar:add-circle-line-duotone" width="20" style="margin-right: 6px;" />
        <span class="hide-mobile-text">Ajouter un produit</span>
      </v-btn>
    </UiBreadCrumbs>

    <div class="summary-grid">
      <button
        v-for="card in SUMMARY_CARDS" :key="card.key"
        class="summary-card" :class="{ active: filterStock === card.key }"
        @click="toggleStockFilter(card.key)"
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
    <p v-if="filterStock !== 'all'" class="scope-hint">
      <Icon icon="solar:info-circle-line-duotone" width="13" />
      Filtre appliqué sur la page {{ currentPage }} uniquement — change de page pour voir d'autres résultats.
    </p>

    <div class="toolbar">
      <v-text-field
        v-model="search"
        variant="solo-filled"
        density="comfortable"
        flat
        hide-details
        rounded="xl"
        placeholder="Rechercher un produit..."
        class="search-field"
      >
        <template #prepend-inner>
          <Icon icon="solar:magnifer-line-duotone" width="18" />
        </template>
        <template v-if="search" #append-inner>
          <Icon icon="solar:close-circle-line-duotone" width="16" class="clear-icon" @click="clearSearch" />
        </template>
      </v-text-field>

      <v-btn variant="tonal" color="secondary" rounded="xl" @click="filterOpen = true">
        <Icon icon="solar:tuning-2-line-duotone" width="18" style="margin-right: 6px;" />
        Filtrer
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

    <div v-if="loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="40" />
    </div>

    <div v-else-if="filteredProducts.length === 0" class="empty-block">
      <Icon icon="solar:box-minimalistic-line-duotone" width="48" />
      <p>Aucun produit trouvé.</p>
    </div>

    <!-- Table -->
    <div v-else-if="viewMode === 'table'" class="products-table hide-mobile">
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
          <tr v-for="p in filteredProducts" :key="p.id" class="row-clickable" @click="goToDetail(p)">
            <td>
              <div class="product-cell">
                <button v-if="getImages(p).length" class="product-thumb-btn" @click="openLightbox(p, 0, $event)">
                  <img :src="getImages(p)[0]" :alt="p.name" class="product-thumb">
                </button>
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
            <td><span class="stock-badge" :class="stockStatus(p).class">{{ stockStatus(p).label }}</span></td>
            <td class="text-right" @click.stop>
              <v-btn icon variant="text" size="36" :to="`/backoffice/products/${p.id}/edit`">
                <Icon icon="solar:pen-line-duotone" width="17" />
              </v-btn>
              <v-menu>
                <template #activator="{ props: menuProps }">
                  <v-btn icon variant="text" size="36" v-bind="menuProps">
                    <Icon icon="solar:menu-dots-line-duotone" width="17" />
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item :to="`/backoffice/products/${p.id}`">
                    <Icon icon="solar:eye-line-duotone" width="16" style="margin-right: 8px;" />
                    Voir le détail
                  </v-list-item>
                  <v-list-item :to="`/shop/${p.slug}`" target="_blank">
                    <Icon icon="solar:cart-line-duotone" width="16" style="margin-right: 8px;" />
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

    <!-- Cards -->
    <div v-else class="product-grid">
      <div v-for="p in filteredProducts" :key="p.id" class="product-card" @click="goToDetail(p)">

        <div
          class="card-image"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd(p, $event)"
        >
          <button
            v-if="getImages(p).length"
            class="image-link"
            @click.stop="openLightbox(p, getCardIndex(p))"
          >
            <img :src="getImages(p)[getCardIndex(p)]" :alt="p.name">
            <span class="zoom-hint"><Icon icon="solar:magnifer-zoom-in-line-duotone" width="18" /></span>
          </button>
          <div v-else class="image-placeholder">
            <Icon icon="solar:box-line-duotone" width="32" />
          </div>

          <span class="stock-badge floating" :class="stockStatus(p).class">{{ stockStatus(p).label }}</span>

          <template v-if="getImages(p).length > 1">
            <button class="carousel-arrow left" @click.stop="prevImage(p, $event)">
              <Icon icon="solar:alt-arrow-left-line-duotone" width="16" />
            </button>
            <button class="carousel-arrow right" @click.stop="nextImage(p, $event)">
              <Icon icon="solar:alt-arrow-right-line-duotone" width="16" />
            </button>
            <div class="carousel-dots">
              <button
                v-for="(img, i) in getImages(p)" :key="i"
                class="carousel-dot" :class="{ active: i === getCardIndex(p) }"
                @click.stop="setCardIndex(p, i, $event)"
              />
            </div>
          </template>
        </div>

        <div class="card-body">
          <div class="card-info">
            <div class="product-name">{{ p.name }}</div>
            <div class="product-variant">{{ p.variantName }}</div>
          </div>
          <div class="product-price">{{ p.price }}€</div>
        </div>

        <div class="card-actions" @click.stop>
          <v-btn variant="tonal" color="secondary" rounded="xl" size="34" :to="`/backoffice/products/${p.id}/edit`" class="edit-btn">
            <Icon icon="solar:pen-line-duotone" width="15" style="margin-right: 5px;" />
            Modifier
          </v-btn>
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn icon variant="tonal" color="secondary" size="34" v-bind="menuProps">
                <Icon icon="solar:menu-dots-line-duotone" width="16" />
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item :to="`/backoffice/products/${p.id}`">
                <Icon icon="solar:eye-line-duotone" width="16" style="margin-right: 8px;" />
                Voir le détail
              </v-list-item>
              <v-list-item :to="`/shop/${p.slug}`" target="_blank">
                <Icon icon="solar:cart-line-duotone" width="16" style="margin-right: 8px;" />
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
    </div>

    <UiPagination v-model="currentPage" :total-pages="totalPages" />

    <v-btn icon size="50" color="secondary" variant="flat" class="fab-add hide-desktop pt-2 pl-0.9" to="/backoffice/products/new" elevation="4">
      <Icon icon="solar:add-circle-line-duotone" width="36" />
    </v-btn>

    <v-navigation-drawer v-model="filterOpen" temporary location="right" width="320">
      <div class="filter-drawer">
        <div class="filter-head">
          <h3>Filtrer</h3>
          <v-btn icon color="error" variant="text" size="36" @click="filterOpen = false">
            <Icon icon="solar:close-circle-line-duotone" width="22" />
          </v-btn>
        </div>

        <div class="filter-body">
          <label class="filter-label">Catégorie</label>
          <v-select
            v-model="filterCategory"
            :items="CATEGORY_OPTIONS"
            :loading="categoriesStore.loading"
            item-title="title"
            item-value="value"
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

    <v-dialog v-model="lightboxOpen" fullscreen transition="fade-transition" class="lightbox-dialog">
      <div v-if="lightboxProduct" class="lightbox" @click.stop>
        <div class="lightbox-header">
          <div class="lightbox-title">
            <div class="lightbox-name">{{ lightboxProduct.name }}</div>
            <div class="lightbox-counter">{{ lightboxIndex + 1 }} / {{ lightboxImages.length }}</div>
          </div>
          <v-btn icon variant="text" color="white" size="40" @click="lightboxOpen = false">
            <Icon icon="solar:close-circle-line-duotone" width="26" />
          </v-btn>
        </div>

        <div class="lightbox-stage">
          <button v-if="lightboxImages.length > 1" class="stage-arrow left" @click="lightboxPrev">
            <Icon icon="solar:alt-arrow-left-line-duotone" width="22" />
          </button>

          <img :src="lightboxImages[lightboxIndex]" :alt="lightboxProduct.name" class="stage-image">

          <button v-if="lightboxImages.length > 1" class="stage-arrow right" @click="lightboxNext">
            <Icon icon="solar:alt-arrow-right-line-duotone" width="22" />
          </button>
        </div>

        <div v-if="lightboxImages.length > 1" class="lightbox-thumbs">
          <button
            v-for="(img, i) in lightboxImages" :key="i"
            class="thumb-btn" :class="{ active: i === lightboxIndex }"
            @click="lightboxIndex = i"
          >
            <img :src="img" :alt="`${lightboxProduct.name} ${i + 1}`">
          </button>
        </div>
      </div>
    </v-dialog>

  </div>
</template>

<style scoped>
.hide-desktop { display: block; }
.hide-mobile  { display: none; }
.hide-mobile-text { display: none; }

.summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 10px; }
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

.scope-hint {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 16px;
}

.toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
.search-field { flex: 1; }
.clear-icon { cursor: pointer; color: rgb(var(--v-theme-on-surface-variant)); }

.loading-block, .empty-block {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px 0; color: rgb(var(--v-theme-on-surface-variant));
}
.empty-block p { font-size: 13px; }

.product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.product-card {
  display: flex; flex-direction: column;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); overflow: hidden;
  transition: border-color .2s, box-shadow .2s, transform .2s;
  cursor: pointer;
}
.product-card:hover { border-color: rgb(var(--v-theme-secondary)); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.07); }

.card-image { position: relative; aspect-ratio: 1; background: rgb(var(--v-theme-surface-variant)); overflow: hidden; touch-action: pan-y; }
.image-link { display: block; width: 100%; height: 100%; border: none; padding: 0; background: none; cursor: zoom-in; position: relative; }
.card-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
.image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgb(var(--v-theme-on-surface-variant)); }

.zoom-hint {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0); color: #FFF;
  opacity: 0; transition: opacity .2s, background .2s;
}
.image-link:hover .zoom-hint { opacity: 1; background: rgba(0, 0, 0, 0.25); }

.carousel-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 26px; height: 26px; border-radius: 50%;
  background: rgba(250, 250, 248, 0.9); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer; opacity: 0; transition: opacity .2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
.card-image:hover .carousel-arrow { opacity: 1; }
.carousel-arrow.left { left: 8px; }
.carousel-arrow.right { right: 8px; }

.carousel-dots {
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 4px;
}
.carousel-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.6); border: none; cursor: pointer;
  transition: background .2s, width .2s;
}
.carousel-dot.active { background: #FFF; width: 14px; border-radius: 3px; }

.card-body { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 12px 12px 0; }
.card-info { min-width: 0; }
.product-name { font-size: 13px; font-weight: 700; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.product-variant { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }
.product-price { font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-secondary)); white-space: nowrap; flex-shrink: 0; }

.card-actions { display: flex; align-items: center; gap: 6px; padding: 10px 12px 12px; }
.edit-btn { flex: 1; }
.edit-btn :deep(.v-btn__content) { font-size: 11.5px; font-weight: 700; }

.stock-badge { display: inline-flex; padding: 3px 9px; border-radius: var(--r-full); font-size: 10.5px; font-weight: 700; }
.stock-badge.ok  { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.stock-badge.low { background: rgba(217, 164, 65, 0.15); color: #B8862F; }
.stock-badge.out { background: rgba(192, 83, 62, 0.12); color: #C0533E; }
.stock-badge.floating {
  position: absolute; top: 10px; right: 10px; z-index: 2;
  background: rgba(250, 250, 248, 0.92);
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.row-clickable { cursor: pointer; }
.row-clickable:hover { background: rgba(var(--v-theme-secondary), 0.04); }

.product-cell { display: flex; align-items: center; gap: 12px; }
.product-thumb-btn { border: none; background: none; padding: 0; cursor: zoom-in; flex-shrink: 0; }
.product-thumb {
  width: 48px; height: 48px; border-radius: var(--r-md);
  object-fit: cover; flex-shrink: 0;
  background: rgb(var(--v-theme-surface-variant));
}
.product-thumb.placeholder { display: flex; align-items: center; justify-content: center; color: rgb(var(--v-theme-on-surface-variant)); }

.fab-add { position: fixed; bottom: 24px; right: 20px; z-index: 50; }
.danger-item { color: #C0533E; }

.filter-drawer { display: flex; flex-direction: column; height: 100%; padding: 20px; }
.filter-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.filter-head h3 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; }
.filter-body { flex: 1; }
.filter-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 8px; }
.filter-foot { display: flex; gap: 10px; padding-top: 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }

.lightbox {
  height: 100%; display: flex; flex-direction: column;
  background: rgba(10, 8, 6, 0.97);
}
.lightbox-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; flex-shrink: 0;
}
.lightbox-title { color: #FFF; }
.lightbox-name { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 700; }
.lightbox-counter { font-size: 11px; color: rgba(255, 255, 255, 0.6); margin-top: 2px; }

.lightbox-stage {
  flex: 1; position: relative;
  display: flex; align-items: center; justify-content: center;
  padding: 0 60px; min-height: 0;
}
.stage-image { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: var(--r-lg); }

.stage-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.1); color: #FFF;
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer; transition: background .2s;
}
.stage-arrow:hover { background: rgba(255, 255, 255, 0.2); }
.stage-arrow.left { left: 12px; }
.stage-arrow.right { right: 12px; }

.lightbox-thumbs {
  display: flex; gap: 8px; padding: 16px 20px; overflow-x: auto; flex-shrink: 0;
}
.thumb-btn {
  width: 56px; height: 56px; border-radius: var(--r-md); overflow: hidden; flex-shrink: 0;
  border: 2px solid transparent; opacity: 0.5; transition: opacity .2s, border-color .2s;
  padding: 0; cursor: pointer;
}
.thumb-btn.active { opacity: 1; border-color: rgb(var(--v-theme-secondary)); }
.thumb-btn img { width: 100%; height: 100%; object-fit: cover; display: block; }

@media (min-width: 640px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 960px) {
  .hide-desktop { display: none; }
  .hide-mobile  { display: flex; }
  .hide-mobile-text { display: inline; }

  .summary-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .summary-card { padding: 16px; }
  .summary-icon { width: 42px; height: 42px; }
  .summary-value { font-size: 22px; }

  .product-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }

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
  .products-table td { padding: 14px 18px; font-size: 13px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
  .products-table tr:last-child td { border-bottom: none; }
  .products-table .text-right { text-align: right; white-space: nowrap; }

  .fab-add { display: none; }
}

@media (min-width: 1280px) {
  .product-grid { grid-template-columns: repeat(5, 1fr); }
}
</style>