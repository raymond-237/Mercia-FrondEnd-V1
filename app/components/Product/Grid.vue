<script setup lang="ts">
import type { ProductCardData } from '~/types/public/index.type';


defineProps<{
  products: ProductCardData[]
  loading?: boolean
  skeletonCount?: number
}>()
</script>

<template>
  <div class="product-grid">

    <template v-if="loading">
      <v-skeleton-loader
        v-for="i in (skeletonCount ?? 4)"
        :key="i"
        type="image, text"
        class="product-skeleton"
      />
    </template>

    <template v-else>
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </template>

  </div>
</template>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.product-skeleton {
  border-radius: var(--r-lg);
  overflow: hidden;
  aspect-ratio: 4/5;
}

@media (max-width: 1100px) { .product-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px)  { .product-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } }
</style>