<script setup lang="ts">
import type { ProductCardData } from '~/types/public/index.type'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ product: ProductCardData }>()

const sf    = useStorefront()
const toast = useToast()
const { t } = useI18n()

const isLowStock = computed(() =>
  !!props.product.stockQuantity &&
  !!props.product.lowStockThreshold &&
  props.product.stockQuantity > 0 &&
  props.product.stockQuantity <= props.product.lowStockThreshold
)
const isWishlisted = computed(() => sf.isWishlisted(props.product.id))

/*
  Fonctionnel uniquement si fetchProducts() a été appelé avec
  include: '...,productVariants' — sinon defaultVariantId reste vide
  et le bouton se masque de lui-même (v-if côté template) plutôt que
  de tenter un ajout invalide.
*/
const canQuickAdd = computed(() => !!props.product.defaultVariantId)

function onWishlist(e: Event) {
  e.preventDefault()
  if (import.meta.client) navigator.vibrate?.(8)
  sf.toggleWishlist(props.product.id)
}

function onAddToCart(e: Event) {
  e.preventDefault()
  if (!canQuickAdd.value) return

  if (import.meta.client) navigator.vibrate?.(12)
  sf.addToCart({
    variantId:   props.product.defaultVariantId,
    productId:   props.product.id,
    productName: props.product.name,
    variantName: props.product.variantName,
    price:       props.product.price,
    imageUrl:    props.product.imageUrl,
    minQuantity: props.product.minQuantity,
    maxQuantity: props.product.maxQuantity,
  })

  toast.success(t('common.toast.addedToCart', { name: props.product.name }))
}
</script>

<template>
  <NuxtLink :to="`/shop/${product.slug}`" class="product-card">

    <div class="product-media">

      <div class="badges-top">
        <span v-if="product.isNew" class="badge badge-new">Nouveau</span>
        <span v-else-if="product.isBestSeller" class="badge">Best-seller</span>
        <span v-else></span>

        <span v-if="product.rating" class="rating">
          <Icon icon="solar:star-line-duotone" width="13" />
          {{ product.rating.toFixed(1) }}
        </span>
      </div>

      <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" loading="lazy">
      <div v-else class="no-image">
        <Icon icon="solar:gallery-line-duotone" width="28" />
      </div>

      <button
        class="wish-btn"
        :class="{ liked: isWishlisted }"
        aria-label="Favoris"
        @click="onWishlist"
      >
        <Icon
          :icon="isWishlisted ? 'solar:heart-line-duotone' : 'solar:heart-angle-line-duotone'"
          width="16"
        />
      </button>

      <span v-if="isLowStock" class="stock-flag">
        <Icon icon="solar:fire-line-duotone" width="11" />
        {{ product.stockQuantity }} restants
      </span>

      <button
        v-if="canQuickAdd"
        class="cart-btn-fab"
        aria-label="Ajouter au panier"
        @click="onAddToCart"
      >
        <Icon icon="solar:bag-4-line-duotone" width="20" />
      </button>

    </div>

    <div class="product-info">
      <div class="info-left">
        <div class="product-name">{{ product.name }}</div>
        <div v-if="product.variantName" class="product-meta">{{ product.variantName }}</div>
      </div>
      <div class="product-price">
        {{ product.price }}€
        <span v-if="product.comparePrice" class="compare">{{ product.comparePrice }}€</span>
      </div>
    </div>

    <div v-if="product.shippingEstimate" class="product-shipping">
      <Icon icon="solar:delivery-line-duotone" width="15" />
      {{ product.shippingEstimate }}
    </div>

  </NuxtLink>
</template>

<style scoped>
.product-card { display: block; text-decoration: none; color: inherit; }

.product-media {
  position: relative;
  border-radius: var(--r-lg);
  overflow: hidden;
  aspect-ratio: 4/5;
  background: rgb(var(--v-theme-surface-variant));
  margin-bottom: 10px;
}
.product-media img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  transition: transform .5s ease;
}
.product-card:hover .product-media img { transform: scale(1.04); }

.no-image {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-on-surface-variant));
}

.badges-top {
  position: absolute; top: 10px; left: 10px; right: 10px;
  display: flex; justify-content: space-between; align-items: flex-start;
  pointer-events: none;
}
.badge {
  font-size: 9px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  padding: 4px 10px; border-radius: var(--r-xl);
  background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-on-surface));
}
.badge-new { background: rgb(var(--v-theme-secondary)); color: rgb(var(--v-theme-on-primary)); }

.rating {
  display: flex; align-items: center; gap: 3px;
  background: rgba(var(--v-theme-surface), 0.92);
  backdrop-filter: blur(6px);
  padding: 4px 9px; border-radius: var(--r-sm);
  font-size: 11px; font-weight: 700;
}
.rating :deep(svg) { color: #C68A52; }

.wish-btn {
  position: absolute; top: 48px; right: 10px;
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(var(--v-theme-surface), 0.9);
  backdrop-filter: blur(6px);
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-on-surface));
  transition: color .2s, transform .15s;
}
.wish-btn:active { transform: scale(0.85); }
.wish-btn.liked { color: #C0533E; }

.stock-flag {
  position: absolute; bottom: 10px; left: 10px;
  display: flex; align-items: center; gap: 4px;
  background: #C0533E; color: #FAFAF8;
  font-size: 9px; font-weight: 700;
  padding: 4px 10px; border-radius: var(--r-xl);
  pointer-events: none;
}

.cart-btn-fab {
  position: absolute; bottom: 10px; right: 10px;
  width: 36px; height: 36px; border-radius: 50%;
  background: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-on-primary));
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transform: translateY(6px) scale(0.9);
  transition: opacity .2s, transform .2s, background .15s;
}
.product-card:hover .cart-btn-fab { opacity: 1; transform: translateY(0) scale(1); }
@media (hover: none) {
  .cart-btn-fab { opacity: 1; transform: translateY(0) scale(1); }
}

.product-info {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 8px; margin-bottom: 3px;
}
.product-name { font-family: 'Fraunces', serif; font-size: 14px; font-weight: 500; }
.product-meta { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 1px; }
.product-price { font-family: 'Fraunces', serif; font-size: 14px; font-weight: 600; white-space: nowrap; text-align: right; }
.compare { display: block; font-family: 'Inter'; font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); text-decoration: line-through; font-weight: 400; }

.product-shipping {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 600; color: #4C7A4C;
}
</style>