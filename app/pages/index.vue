<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useProductsStore } from '~/stores/Models/products.store'
import type { CategoryData, ProductCardData } from '~/types/public/index.type'

definePageMeta({ layout: 'public' })

const sf            = useStorefront()
const productsStore = useProductsStore()

const { t } = useI18n()

// ── Aucune donnée statique : chargement réel uniquement.

const categories = ref<CategoryData[]>([])
const products   = ref<ProductCardData[]>([])

const loadingCategories = ref(true)
const loadingProducts   = ref(true)
const productsError     = ref(false)

const activeCategory = ref('all')

const loadProducts = async () => {
  loadingProducts.value = true
  productsError.value   = false

  products.value = await productsStore.fetchProducts({
    // status/isVisible : ne jamais exposer de produit brouillon ou
    // masqué sur le storefront public.
    status:    'active',
    isVisible: true,
    include:   'medias,category,productVariants',
  })

  // productsStore.fetchProducts() intercepte déjà ses erreurs en
  // interne — on distingue "vraie panne" de "aucun produit" via
  // productsStore.error plutôt qu'un try/catch qui ne se
  // déclencherait jamais ici.
  if (productsStore.error) {
    productsError.value = true
  }

  loadingProducts.value = false
}

const loadCategories = async () => {
  loadingCategories.value = true
  categories.value = await productsStore.fetchCategories()
  loadingCategories.value = false
}

onMounted(() => {
  loadProducts()
  loadCategories()
})
</script>

<template>
  <div>

    <LayoutsNavbar />

    <div class="hero-wrap">
      <LayoutsBodyHeroCarousel />
    </div>

    <!-- Pills catégories -->
    <div v-if="loadingCategories" class="pills-skeleton">
      <div class="shimmer pill-skel-round" />
      <div v-for="n in 5" :key="n" class="shimmer pill-skel" />
    </div>
    <CategoryPills
      v-else-if="categories.length > 0"
      :categories="categories"
      :active-id="activeCategory"
      @select="activeCategory = $event"
      @open-filters="sf.openFilters()"
    />

    <LayoutsBodyProoBar/>

    <div class="content">

      <!-- Produits -->
      <div class="section-head">
        <div>
          <div class="eyebrow">
            <Icon icon="solar:star-line-duotone" width="27" />
            {{ t('home.selection.eyebrow') }}
          </div>
          <h2 class="section-title">{{ t('home.selection.title') }}</h2>
        </div>
        <NuxtLink to="/shop" class="see-all">
          {{ t('home.selection.seeAll') }}
          <Icon icon="solar:arrow-right-line-duotone" width="20" />
        </NuxtLink>
      </div>

      <!-- Chargement -->
      <ProductSkeletonCard v-if="loadingProducts" :count="4" />

      <!-- Erreur réelle -->
      <div v-else-if="productsError" class="error-state">
        <Icon icon="solar:cloud-cross-line-duotone" width="36" />
        <p>{{ t('common.errors.loadFailed') }}</p>
        <v-btn variant="tonal" rounded="pill" size="small" @click="loadProducts()">
          {{ t('common.retry') }}
        </v-btn>
      </div>

      <!-- Aucun produit publié pour l'instant -->
      <div v-else-if="products.length === 0" class="empty-state">
        <Icon icon="solar:box-minimalistic-line-duotone" width="36" />
        <p>{{ t('home.selection.empty') }}</p>
      </div>

      <ProductGrid v-else :products="products" />

      <!-- Trust -->
      <div class="trust-strip">
        <div class="trust-item">
          <Icon icon="solar:delivery-line-duotone" width="35" height="35" />
          {{ t('home.trust.delivery') }}
        </div>
        <div class="trust-item">
          <Icon icon="solar:shield-check-line-duotone" width="35" height="35" />
          {{ t('home.trust.payment') }}
        </div>
        <div class="trust-item">
          <Icon icon="solar:undo-left-round-line-duotone" width="35" height="35" />
          {{ t('home.trust.returns') }}
        </div>
        <div class="trust-item">
          <Icon icon="solar:chat-round-dots-line-duotone" width="35" height="35" />
          {{ t('home.trust.whatsapp') }}
        </div>
      </div>

      <LayoutsBodyReviewSection />

      <!-- <LayoutsBodyEditorialBanner /> -->

      <LayoutsBodyNewsLetterBlock @subscribe="(email) => console.log('subscribe:', email)" />

    </div>

    <LayoutsFooter />

  </div>
</template>

<style scoped>
.hero-wrap { padding: 16px 24px 0; }

.content { padding: 0 24px 32px; }

.section-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
}
.eyebrow {
  display: flex; align-items: center; gap: 6px;
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: rgb(var(--v-theme-secondary)); margin-bottom: 4px;
}
.section-title { font-family: 'Fraunces', serif; font-size: clamp(20px, 2.4vw, 26px); font-weight: 500; }
.see-all {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 700; color: rgb(var(--v-theme-on-surface));
  border-bottom: 1.5px solid currentColor; padding-bottom: 1px;
  text-decoration: none; flex-shrink: 0;
}

.error-state,
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 40px 0 48px; text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
}
.error-state p,
.empty-state p { font-size: 13.5px; }

.trust-strip {
  background: rgb(var(--v-theme-primary));
  border-radius: var(--r-lg);
  color: rgba(250,250,248,0.88);
  padding: 16px 20px;
  display: flex; justify-content: space-around; flex-wrap: wrap; gap: 12px;
  margin-bottom: 40px;
}
.trust-item { display: flex; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 600; }

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

@media (max-width: 768px) {
  .hero-wrap { padding: 0; }
}
</style>