<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { useProductsStore } from '~/stores/Models/products.store'

definePageMeta({ layout: 'public' })

const { t } = useI18n()
const toast = useToast()

const route         = useRoute()
const sf            = useStorefront()
const productsStore = useProductsStore()

interface ProductVariant {
  id: string
  name: string
  sku: string | null
  price: number
  isDefault: boolean
  isActive: boolean
  minQuantity: number
  maxQuantity: number | null
  stockQuantity: number
}

interface ProductMedia {
  id: string
  url: string
  collection: string | null
  order: number
}

interface ProductDetail {
  id: string
  slug: string
  name: string
  description: string | null
  shortDescription: string | null
  price: number
  comparePrice: number | null
  sku: string | null
  status: string
  seoTitle: string | null
  seoDescription: string | null
  category: { id: string; name: string; slug: string | null } | null
  images: string[]
  variants: ProductVariant[]
}

// ── Aucune donnée statique/fictive sur cette page : si une info
// manque côté API, elle n'apparaît simplement pas dans l'UI.

const product  = ref<ProductDetail | null>(null)
const loading  = ref(true)
const notFound = ref(false)

/**
 * Les variantes stockent actuellement leur couleur en texte libre dans
 * `name`, au format "Label (#HEXCODE)". Pont temporaire tant que le
 * backoffice n'expose pas d'attributs structurés (couleur/longueur/
 * texture) via optionTypes.
 */
function parseVariantColor(name: string): { label: string; hex: string | null } {
  const match = name?.match(/^(.*?)\s*\(#([0-9a-fA-F]{6})\)$/)
  if (match) return { label: match[1].trim(), hex: `#${match[2]}` }
  return { label: name ?? '', hex: null }
}

/**
 * Galerie construite depuis la relation `medias` réelle (collections
 * "thumbnail" + "gallery", triées par `order`). Pas d'image de secours
 * fictive — un produit sans média affiche un état vide explicite.
 */
function extractImages(medias: ProductMedia[]): string[] {
  const thumbnail = medias.find(m => m.collection === 'thumbnail')
  const gallery = medias
    .filter(m => m.collection === 'gallery')
    .sort((a, b) => a.order - b.order)

  const ordered = [thumbnail, ...gallery].filter(Boolean) as ProductMedia[]
  return Array.from(new Set(ordered.map(m => m.url).filter(Boolean)))
}

const loadProduct = async () => {
  loading.value  = true
  notFound.value = false
  product.value  = null

  try {
    const data = await productsStore.fetchProductBySlug(
      route.params.slug as string,
      'medias,category,productVariants.inventory,optionTypes',
    )

    const resolved = Array.isArray(data) ? data[0] : data
    // Garde-fou : un produit en brouillon/archivé ne doit jamais être
    // consultable publiquement via son URL directe, même si le slug
    // est correct — seuls les produits "active" sont exposés ici.
    if (!resolved || resolved.status !== 'active') {
      notFound.value = true
      return
    }

    product.value = {
      id:               resolved.id,
      slug:             resolved.slug,
      name:             resolved.name,
      description:      resolved.description ?? null,
      shortDescription: resolved.shortDescription ?? null,
      price:            resolved.price,
      comparePrice:     resolved.comparePrice,
      sku:              resolved.sku ?? null,
      status:           resolved.status,
      seoTitle:         resolved.seoTitle ?? null,
      seoDescription:   resolved.seoDescription ?? null,
      category:         resolved.category ?? null,
      images:           extractImages(resolved.medias ?? []),
      variants:         resolved.variants ?? [],
    }
  } catch (e) {
    console.error('Erreur chargement fiche produit:', e)
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadProduct)

/**
 * Nuxt réutilise la même instance de page en navigation interne entre
 * deux fiches produit (même route dynamique [slug]) — sans ce watch,
 * product.value resterait celui du produit précédent après un clic
 * sur un autre produit, causant un ajout au panier du mauvais article.
 */
watch(() => route.params.slug, () => {
  loadProduct()
})

const activeImage    = ref(0)
const selectedVariantId = ref('')
const quantity        = ref(1)
const activeTab       = ref<'description' | 'care' | 'delivery'>('description')

watch(product, (p) => {
  if (!p) return
  const defaultVariant = p.variants.find(v => v.isDefault) ?? p.variants[0]
  selectedVariantId.value = defaultVariant?.id ?? ''
  activeImage.value       = 0
  activeTab.value         = p.description ? 'description' : 'care'
  quantity.value           = defaultVariant?.minQuantity ?? 1
})

const selectedVariant = computed(
  () => product.value?.variants.find(v => v.id === selectedVariantId.value) ?? null
)

const swatches = computed(() =>
  (product.value?.variants ?? []).map(v => ({
    id: v.id,
    ...parseVariantColor(v.name),
    isActive: v.isActive,
    inStock: v.stockQuantity > 0,
  }))
)

const selectedSwatchLabel = computed(
  () => swatches.value.find(s => s.id === selectedVariantId.value)?.label ?? ''
)

const displayPrice = computed(() => selectedVariant.value?.price ?? product.value?.price ?? 0)

const discountPercent = computed(() => {
  const compare = product.value?.comparePrice
  if (!compare || compare <= displayPrice.value) return null
  return Math.round((1 - displayPrice.value / compare) * 100)
})

const stockState = computed(() => {
  const v = selectedVariant.value
  if (!v) return null
  if (v.stockQuantity <= 0) return 'out'
  if (v.stockQuantity <= 5) return 'low'
  return 'available'
})

const canAddToCart = computed(() =>
  !!selectedVariant.value && selectedVariant.value.isActive && selectedVariant.value.stockQuantity > 0
)

function goToImage(i: number) {
  if (!product.value || !product.value.images.length) return
  const len = product.value.images.length
  activeImage.value = (i + len) % len
}

let touchStartX = 0
let touchDeltaX = 0
function onTouchStart(e: TouchEvent) { touchStartX = e.touches[0].clientX; touchDeltaX = 0 }
function onTouchMove(e: TouchEvent)  { touchDeltaX = e.touches[0].clientX - touchStartX }
function onTouchEnd() {
  if (touchDeltaX < -40) goToImage(activeImage.value + 1)
  else if (touchDeltaX > 40) goToImage(activeImage.value - 1)
}

function onAddToCart() {
  if (!product.value || !selectedVariant.value) return
  if (!canAddToCart.value) return

  if (import.meta.client) navigator.vibrate?.(12)
  sf.addToCart({
    variantId:   selectedVariant.value.id,
    productId:   product.value.id,
    productName: product.value.name,
    variantName: selectedSwatchLabel.value,
    price:       selectedVariant.value.price,
    imageUrl:    product.value.images[0] ?? '',
    minQuantity: selectedVariant.value.minQuantity,
    maxQuantity: selectedVariant.value.maxQuantity,
  }, quantity.value)

  toast.success(t('common.toast.addedToCart', { name: product.value.name }))
}

// ── SEO — utilise les champs dédiés s'ils existent, sinon retombe sur
// le nom/description courte du produit (jamais de texte générique fictif)
watch(product, (p) => {
  if (!p) return
  useSeoMeta({
    title:       p.seoTitle || p.name,
    description: p.seoDescription || p.shortDescription || undefined,
  })
})
</script>

<template>
  <div>

    <LayoutsNavbar />

    <!-- Skeleton pendant le chargement -->
    <div v-if="loading" class="content">
      <ProductSkeletonDetails />
    </div>

    <div v-else-if="notFound" class="not-found">
      <div class="not-found-icon">
        <Icon icon="solar:sad-circle-line-duotone" width="32" />
      </div>
      <h1 class="not-found-title">{{ t('product.notFound.title') }}</h1>
      <p class="not-found-sub">{{ t('product.notFound.subtitle') }}</p>
      <v-btn color="primary" variant="flat" rounded="pill" size="large" to="/shop">
        <Icon icon="solar:bag-4-line-duotone" width="16" style="margin-right: 8px;" />
        {{ t('product.notFound.backToShop') }}
      </v-btn>
    </div>

    <div v-else-if="product" class="content">

      <!-- Breadcrumb dynamique — reflète la vraie catégorie du produit -->
      <div class="breadcrumb">
        <NuxtLink to="/shop">{{ t('product.breadcrumb.collection') }}</NuxtLink>
        <template v-if="product.category">
          <Icon icon="solar:alt-arrow-right-line-duotone" width="12" />
          <NuxtLink :to="`/shop?category=${product.category.slug}`">{{ product.category.name }}</NuxtLink>
        </template>
        <Icon icon="solar:alt-arrow-right-line-duotone" width="12" />
        <span>{{ product.name }}</span>
      </div>

      <div class="product-layout">

        <!-- Galerie -->
        <div class="gallery">

          <div v-if="product.images.length === 0" class="carousel no-image">
            <Icon icon="solar:gallery-line-duotone" width="40" />
            <span>{{ t('product.gallery.noImage') }}</span>
          </div>

          <div
            v-else
            class="carousel"
            @touchstart.passive="onTouchStart"
            @touchmove.passive="onTouchMove"
            @touchend.passive="onTouchEnd"
          >
            <div
              class="carousel-track"
              :style="{ transform: `translateX(-${activeImage * 100}%)` }"
            >
              <div v-for="(img, i) in product.images" :key="i" class="carousel-slide">
                <img :src="img" :alt="t('product.gallery.viewLabel', { name: product.name, n: i + 1 })" loading="eager">
              </div>
            </div>

            <span v-if="discountPercent" class="badge-discount">
              -{{ discountPercent }}%
            </span>

            <button
              v-if="product.images.length > 1"
              class="carousel-arrow left"
              :aria-label="t('product.gallery.prevImage')"
              @click="goToImage(activeImage - 1)"
            >
              <Icon icon="solar:alt-arrow-left-line-duotone" width="16" />
            </button>
            <button
              v-if="product.images.length > 1"
              class="carousel-arrow right"
              :aria-label="t('product.gallery.nextImage')"
              @click="goToImage(activeImage + 1)"
            >
              <Icon icon="solar:alt-arrow-right-line-duotone" width="16" />
            </button>

            <div v-if="product.images.length > 1" class="carousel-dots">
              <button
                v-for="(img, i) in product.images"
                :key="i"
                class="carousel-dot"
                :class="{ active: activeImage === i }"
                :aria-label="t('product.gallery.goToImage', { n: i + 1 })"
                @click="goToImage(i)"
              />
            </div>
          </div>

          <div v-if="product.images.length > 1" class="thumbs">
            <button
              v-for="(img, i) in product.images"
              :key="i"
              class="thumb"
              :class="{ active: activeImage === i }"
              @click="activeImage = i"
            >
              <img :src="img" :alt="t('product.gallery.thumbLabel', { n: i + 1 })">
            </button>
          </div>
        </div>

        <!-- Infos produit -->
        <div class="product-info">

          <div class="product-header">
            <h1>{{ product.name }}</h1>
            <p v-if="product.shortDescription" class="tagline">{{ product.shortDescription }}</p>
            <p v-if="product.sku" class="sku">{{ t('product.sku', { sku: product.sku }) }}</p>
          </div>

          <div class="price-row">
            <span class="price">{{ displayPrice.toFixed(2) }}€</span>
            <span v-if="discountPercent" class="compare">{{ product.comparePrice?.toFixed(2) }}€</span>
          </div>

          <!-- État stock de la variante sélectionnée -->
          <div v-if="stockState === 'low'" class="stock-note low">
            <Icon icon="solar:fire-line-duotone" width="14" />
            {{ t('product.stock.low', { count: selectedVariant?.stockQuantity }) }}
          </div>
          <div v-else-if="stockState === 'out'" class="stock-note out">
            <Icon icon="solar:danger-triangle-line-duotone" width="14" />
            {{ t('product.stock.out') }}
          </div>
          <div v-else-if="stockState === 'available'" class="stock-note available">
            <Icon icon="solar:check-circle-line-duotone" width="14" />
            {{ t('product.stock.available') }}
          </div>

          <!-- Sélecteur de variante -->
          <div v-if="swatches.length" class="option-group">
            <div class="option-label">
              {{ t('product.options.variant') }}
              <span class="option-selected">{{ selectedSwatchLabel }}</span>
            </div>
            <div class="color-swatches">
              <button
                v-for="s in swatches"
                :key="s.id"
                class="color-swatch"
                :class="{ active: selectedVariantId === s.id, disabled: !s.isActive }"
                :disabled="!s.isActive"
                :aria-label="s.label"
                :style="s.hex ? { background: s.hex } : {}"
                @click="selectedVariantId = s.id"
              >
                <span v-if="!s.hex" class="swatch-fallback">{{ s.label.charAt(0) }}</span>
                <Icon
                  v-if="selectedVariantId === s.id"
                  icon="solar:check-circle-bold-duotone"
                  width="14"
                  class="swatch-check"
                />
                <span v-if="!s.isActive" class="swatch-slash" />
              </button>
            </div>
          </div>

          <!-- Quantité -->
          <div class="qty-row">
            <div class="qty-label">{{ t('product.options.quantity') }}</div>
            <div class="qty-ctrl">
              <v-btn
                icon size="small" variant="tonal" rounded="xl"
                :disabled="quantity <= (selectedVariant?.minQuantity ?? 1)"
                @click="quantity = Math.max(selectedVariant?.minQuantity ?? 1, quantity - 1)"
              >
                <Icon icon="solar:minus-circle-line-duotone" width="28" />
              </v-btn>
              <span>{{ quantity }}</span>
              <v-btn
                icon size="small" variant="tonal" rounded="xl"
                :disabled="!!selectedVariant?.maxQuantity && quantity >= selectedVariant.maxQuantity"
                @click="quantity = Math.min(selectedVariant?.maxQuantity ?? 99, quantity + 1)"
              >
                <Icon icon="solar:add-circle-line-duotone" width="28" />
              </v-btn>
            </div>
          </div>

          <!-- CTA Desktop -->
          <v-btn
            class="add-to-cart-desktop"
            color="primary" variant="flat" rounded="pill" size="large" block
            :disabled="!canAddToCart"
            @click="onAddToCart"
          >
            <Icon icon="solar:bag-4-line-duotone" width="18" style="margin-right: 8px;" />
            {{ canAddToCart ? t('product.addToCart') : t('product.stock.out') }}
          </v-btn>

          <!-- Onglets -->
          <div class="tabs">
            <button
              v-if="product.description"
              class="tab"
              :class="{ active: activeTab === 'description' }"
              @click="activeTab = 'description'"
            >{{ t('product.tabs.description') }}</button>
            <button
              class="tab"
              :class="{ active: activeTab === 'care' }"
              @click="activeTab = 'care'"
            >{{ t('product.tabs.care') }}</button>
            <button
              class="tab"
              :class="{ active: activeTab === 'delivery' }"
              @click="activeTab = 'delivery'"
            >{{ t('product.tabs.delivery') }}</button>
          </div>

          <div class="tab-content">
            <p v-if="activeTab === 'description' && product.description">{{ product.description }}</p>
            <p v-else-if="activeTab === 'care'">{{ t('product.careText') }}</p>
            <p v-else-if="activeTab === 'delivery'">{{ t('product.deliveryText') }}</p>
          </div>

        </div>

      </div>

    </div>

    <LayoutsFooter />

    <!-- CTA sticky mobile -->
    <div v-if="product && !loading && !notFound" class="sticky-add-to-cart">
      <div class="sticky-price">{{ displayPrice.toFixed(2) }}€</div>
      <v-btn
        color="primary" variant="flat" rounded="pill"
        style="flex: 1;"
        :disabled="!canAddToCart"
        @click="onAddToCart"
      >
        <Icon icon="solar:bag-4-line-duotone" width="16" style="margin-right: 6px;" />
        {{ canAddToCart ? t('product.addToCart') : t('product.stock.out') }}
      </v-btn>
    </div>

  </div>
</template>

<style scoped>
.content { padding: 0 20px 100px; }

.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
  min-height: calc(100dvh - 72px - 90px);
  padding: 40px 24px;
}

.not-found-icon {
  width: 64px; height: 64px;
  border-radius: var(--r-lg);
  background: rgb(var(--v-theme-surface-variant));
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary));
  margin-bottom: 4px;
}

.not-found-title {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.not-found-sub {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
  max-width: 280px;
  margin-bottom: 6px;
}

.breadcrumb {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  font-size: 12px; color: rgb(var(--v-theme-on-surface-variant));
  padding: 12px 0 16px;
}
.breadcrumb a { color: inherit; text-decoration: none; }
.breadcrumb a:hover { color: rgb(var(--v-theme-on-surface)); }

.product-layout { display: flex; flex-direction: column; gap: 20px; }

.carousel {
  position: relative;
  border-radius: var(--r-lg);
  overflow: hidden;
  aspect-ratio: 1;
  background: rgb(var(--v-theme-surface-variant));
  touch-action: pan-y;
}

.carousel.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 12.5px;
  font-weight: 600;
}

.carousel-track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform .4s cubic-bezier(.4,0,.2,1);
}
.carousel-slide { flex: 0 0 100%; height: 100%; }
.carousel-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }

.badge-discount {
  position: absolute; top: 12px; left: 12px;
  background: #C0533E; color: #FAFAF8;
  font-size: 10px; font-weight: 700; letter-spacing: 0.02em;
  padding: 5px 11px; border-radius: var(--r-sm);
}

.carousel-arrow { display: none; }

.carousel-dots {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 6px;
}
.carousel-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.5); border: none; padding: 0; cursor: pointer;
  transition: background .2s, transform .2s;
}
.carousel-dot.active { background: #FAFAF8; transform: scale(1.3); }

.thumbs { display: none; }

.product-header { margin-bottom: 14px; }
.product-header h1 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; margin-bottom: 4px; }
.tagline {
  font-family: 'Fraunces', serif; font-style: italic; font-size: 13.5px;
  color: rgb(var(--v-theme-secondary)); margin-bottom: 6px;
}
.sku {
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
}

.price-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; }
.price { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700; color: rgb(var(--v-theme-secondary)); }
.compare { font-size: 15px; color: rgb(var(--v-theme-on-surface-variant)); text-decoration: line-through; }

.stock-note {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11.5px; font-weight: 700;
  padding: 5px 12px; border-radius: var(--r-full);
  margin-bottom: 18px;
}
.stock-note.low { background: rgba(198, 138, 82, 0.15); color: #C68A52; }
.stock-note.out { background: rgba(192, 83, 62, 0.12); color: #C0533E; }
.stock-note.available { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }

.option-group { margin-bottom: 18px; }
.option-label { font-size: 12px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.option-selected { font-weight: 400; color: rgb(var(--v-theme-on-surface-variant)); }

.color-swatches { display: flex; flex-wrap: wrap; gap: 10px; }
.color-swatch {
  position: relative;
  width: 36px; height: 36px; border-radius: 50%;
  border: 2px solid rgb(var(--v-theme-surface));
  box-shadow: 0 0 0 1.5px rgb(var(--v-theme-outline));
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: rgb(var(--v-theme-surface-variant));
  transition: box-shadow .2s, transform .15s;
}
.color-swatch:active { transform: scale(0.92); }
.color-swatch.active { box-shadow: 0 0 0 2px rgb(var(--v-theme-secondary)); }
.color-swatch.disabled { opacity: 0.35; cursor: not-allowed; }
.swatch-check { color: #FAFAF8; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5)); }
.swatch-fallback { font-size: 12px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }
.swatch-slash {
  position: absolute; inset: 0; margin: auto; width: 140%; height: 1.5px;
  background: rgba(192, 83, 62, 0.8); transform: rotate(45deg);
}

.qty-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.qty-label { font-size: 12px; font-weight: 700; }
.qty-ctrl { display: flex; align-items: center; gap: 12px; }
.qty-ctrl span { font-size: 15px; font-weight: 700; min-width: 20px; text-align: center; }

.add-to-cart-desktop { display: none; margin-bottom: 24px; }

.tabs { display: flex; gap: 0; border-bottom: 1px solid rgb(var(--v-theme-outline)); margin-bottom: 14px; }
.tab {
  padding: 10px 16px; font-size: 12.5px; font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
  background: none; border: none; cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color .2s, border-color .2s;
}
.tab.active { color: rgb(var(--v-theme-secondary)); border-bottom-color: rgb(var(--v-theme-secondary)); }
.tab-content p { font-size: 13.5px; line-height: 1.65; color: rgb(var(--v-theme-on-surface-variant)); }

.sticky-add-to-cart {
  display: flex;
  position: fixed; bottom: 0; left: 0; right: 0;
  z-index: 80;
  background: rgb(var(--v-theme-surface));
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid rgb(var(--v-theme-outline));
  gap: 12px; align-items: center;
  box-shadow: 0 -8px 20px rgba(0,0,0,0.06);
}
.sticky-price { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; flex-shrink: 0; }

@media (min-width: 960px) {
  .content { padding: 0 24px 40px; }
  .breadcrumb { padding: 12px 0 20px; }

  .product-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }

  .carousel-arrow {
    display: flex;
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 36px; height: 36px; border-radius: 50%;
    align-items: center; justify-content: center;
    background: rgba(255,255,255,0.85); backdrop-filter: blur(6px);
    border: none; cursor: pointer; z-index: 5;
    transition: background .2s;
  }
  .carousel-arrow:hover { background: #FFFFFF; }
  .carousel-arrow.left  { left: 14px; }
  .carousel-arrow.right { right: 14px; }

  .carousel-dots { display: none; }

  .thumbs { display: flex; gap: 8px; margin-top: 10px; }
  .thumb {
    width: 60px; height: 60px; border-radius: 12px; overflow: hidden;
    background: rgb(var(--v-theme-surface-variant)); border: 2px solid transparent;
    cursor: pointer; flex-shrink: 0; transition: border-color .2s;
  }
  .thumb.active { border-color: rgb(var(--v-theme-secondary)); }
  .thumb img { width: 100%; height: 100%; object-fit: cover; }

  .product-header h1 { font-size: 26px; }
  .price { font-size: 28px; }
  .compare { font-size: 16px; }

  .add-to-cart-desktop { display: flex; }
  .sticky-add-to-cart { display: none; }

  .not-found { min-height: calc(100dvh - 88px - 220px); }
  .not-found-icon { width: 72px; height: 72px; }
  .not-found-title { font-size: 24px; }
  .not-found-sub { font-size: 13.5px; max-width: 320px; }
}
</style>