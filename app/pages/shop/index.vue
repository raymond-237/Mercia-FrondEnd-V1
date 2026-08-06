<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useProductsStore } from '~/stores/Models/products.store'
import useProductsService from '~/services/Models/products.service'
import type { CategoryData, ProductCardData } from '~/types/public/index.type'

definePageMeta({ layout: 'public' })

const { t } = useI18n()

const route           = useRoute()
const sf              = useStorefront()
const productsStore   = useProductsStore()
const productsService = useProductsService()

const searchQuery    = computed(() => (route.query.q as string) ?? '')
const activeCategory = ref((route.query.category as string) ?? 'all')
const currentPage    = ref(1)

const categories  = ref<CategoryData[]>([])
const allProducts = ref<ProductCardData[]>([])

const loadingCategories = ref(true)
const loadingProducts   = ref(true)
const productsError     = ref(false)

const hasColorFilter = computed(() => sf.filters.value.color.length > 0)

/**
 * activeCategory peut contenir un SLUG (arrivée via ?category=meches
 * depuis le fil d'Ariane produit) ou potentiellement un id (selon ce que
 * ProductCategoryPills émet au clic) — category_id en base est un UUID,
 * jamais un slug. On résout donc systématiquement vers le vrai id avant
 * tout appel API, en cherchant une correspondance par slug OU par id
 * dans les catégories déjà chargées. Sans ça : "invalid input syntax for
 * type uuid" côté Postgres dès qu'on arrive via un lien de catégorie.
 */
const activeCategoryId = computed(() => {
  if (activeCategory.value === 'all') return undefined
  const match = categories.value.find(
    c => c.slug === activeCategory.value || c.id === activeCategory.value,
  )
  return match?.id
})

const CLIENT_PER_PAGE = 12
const clientFilteredTotal = ref(0)

const loadCategories = async () => {
  loadingCategories.value = true
  categories.value = await productsStore.fetchCategories()
  loadingCategories.value = false
}

const loadFacets = async () => {
  try {
    const { data } = await productsService.list({
      status: 'active',
      isVisible: true,
      perPage: 100,
      include: 'productVariants',
    })

    const colorMap = new Map<string, { label: string; hex: string }>()
    let min = Infinity
    let max = 0

    for (const p of data) {
      for (const c of p.colors ?? []) colorMap.set(c.label, c)
      if (p.price < min) min = p.price
      if (p.price > max) max = p.price
    }

    sf.setAvailableColors(Array.from(colorMap.values()))
    if (data.length) sf.setPriceBounds({ min: Math.floor(min), max: Math.ceil(max) })
  } catch (e) {
    console.error('Erreur chargement facettes:', e)
  }
}

const loadProducts = async () => {
  loadingProducts.value = true
  productsError.value   = false

  const baseParams = {
    category:  activeCategoryId.value,
    search:    searchQuery.value || undefined,
    status:    'active' as const,
    isVisible: true,
    sort:      sf.sortBy.value !== 'position' ? sf.sortBy.value : undefined,
    priceMin:  sf.priceRange.value?.[0],
    priceMax:  sf.priceRange.value?.[1],
  }

  if (hasColorFilter.value) {
    const pool = await productsStore.fetchProducts({
      ...baseParams,
      include: 'medias,category,productVariants',
      perPage: 100,
    })

    if (productsStore.error) {
      productsError.value = true
      allProducts.value   = []
    } else {
      const filtered = pool.filter(p =>
        (p.colors ?? []).some(c => sf.filters.value.color.includes(c.label))
      )
      clientFilteredTotal.value = filtered.length
      const start = (currentPage.value - 1) * CLIENT_PER_PAGE
      allProducts.value = filtered.slice(start, start + CLIENT_PER_PAGE)
    }
  } else {
    allProducts.value = await productsStore.fetchProducts({
      ...baseParams,
      page:    currentPage.value,
      include: 'medias,category,productVariants',
    })

    if (productsStore.error) {
      productsError.value = true
    }
  }

  loadingProducts.value = false
}

// Tout changement de filtre/tri/recherche → retour en page 1
watch([activeCategory, searchQuery, () => sf.sortBy.value, () => sf.priceRange.value], () => {
  currentPage.value = 1
  loadProducts()
})

watch(() => sf.filters.value.color.join(','), () => {
  currentPage.value = 1
  loadProducts()
})

watch(currentPage, () => loadProducts())

onMounted(async () => {
  // Catégories chargées AVANT loadProducts() — activeCategoryId dépend
  // de categories.value pour résoudre le slug de l'URL, donc l'ordre
  // compte ici (pas de Promise.all qui les lancerait en parallèle).
  await loadCategories()
  loadFacets()
  loadProducts()
})

const products = computed(() => allProducts.value)

const totalPages = computed(() =>
  hasColorFilter.value
    ? Math.max(1, Math.ceil(clientFilteredTotal.value / CLIENT_PER_PAGE))
    : (productsStore.pagination?.lastPage ?? 1)
)

const totalResultsCount = computed(() =>
  hasColorFilter.value
    ? clientFilteredTotal.value
    : (productsStore.pagination?.total ?? products.value.length)
)
</script>

<template>
  <div>

    <LayoutsNavbar />

    <div v-if="loadingCategories" class="pills-skeleton">
      <div class="shimmer pill-skel-round" />
      <div v-for="n in 5" :key="n" class="shimmer pill-skel" />
    </div>
    <ProductCategoryPills
      v-else-if="categories.length > 0"
      :categories="categories"
      :active-id="activeCategory"
      @select="activeCategory = $event"
      @open-filters="sf.openFilters()"
    />

    <div class="content">

      <div class="shop-head">
        <h2 class="section-title">
          {{ searchQuery ? t('shop.searchResultsFor', { query: searchQuery }) : t('shop.allCollection') }}
        </h2>
        <span v-if="!loadingProducts && !productsError" class="results-count">
          {{ t('shop.resultsCount', { count: totalResultsCount }) }}
        </span>
      </div>

      <ProductSkeletonCard v-if="loadingProducts" :count="8" />

      <div v-else-if="productsError" class="error-state">
        <Icon icon="solar:cloud-cross-line-duotone" width="40" />
        <p>{{ t('common.errors.loadFailed') }}</p>
        <v-btn variant="tonal" rounded="pill" size="small" @click="loadProducts()">
          {{ t('common.retry') }}
        </v-btn>
      </div>

      <template v-else-if="products.length > 0">
        <ProductGrid :products="products" />
        <UiPagination
          v-if="totalPages > 1"
          v-model="currentPage"
          :total-pages="totalPages"
          :total-visible="5"
          class="pagination-wrap"
        />
      </template>

      <div v-else class="empty-state">
        <Icon icon="solar:magnifer-zoom-out-line-duotone" width="40" />
        <p>{{ t('shop.empty.title') }}</p>
        <v-btn variant="tonal" rounded="pill" size="small" @click="sf.resetFilters()">
          {{ t('shop.empty.resetFilters') }}
        </v-btn>
      </div>

    </div>

    <LayoutsFooter />

  </div>
</template>

<style scoped>
.content { padding: 0 24px 32px; }
.shop-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px; flex-wrap: wrap; gap: 8px;
}
.section-title { font-family: 'Fraunces', serif; font-size: clamp(20px, 2.4vw, 26px); font-weight: 500; }
.results-count { font-size: 12.5px; color: rgb(var(--v-theme-on-surface-variant)); font-weight: 600; }
.pagination-wrap { margin-top: 32px; display: flex; justify-content: center; }

.empty-state,
.error-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 60px 0; text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
}
.empty-state p,
.error-state p { font-size: 14px; }

.pills-skeleton {
  display: flex; align-items: center; gap: 8px;
  padding: 0 24px 20px;
  overflow-x: hidden;
}
.shimmer {
  position: relative;
  overflow: hidden;
  background: rgb(var(--v-theme-surface-variant));
}
.shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(255, 255, 255, 0.35) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  animation: shimmer-sweep 1.6s ease-in-out infinite;
}
.pill-skel-round { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
.pill-skel { width: 80px; height: 38px; border-radius: var(--r-full); flex-shrink: 0; }

@keyframes shimmer-sweep {
  100% { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .shimmer::after { animation: none; }
}
</style>