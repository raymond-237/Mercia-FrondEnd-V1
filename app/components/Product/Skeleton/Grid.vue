<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 8 })
</script>

<template>
  <div class="grid-skeleton">
    <ProductSkeletonCard
      v-for="n in count"
      :key="n"
    />
  </div>
</template>

<style scoped>

.grid-skeleton {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (min-width: 640px) {
  .grid-skeleton { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 960px) {
  .grid-skeleton { grid-template-columns: repeat(4, 1fr); gap: 20px; }
}
</style>