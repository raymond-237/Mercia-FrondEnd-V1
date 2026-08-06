<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { CategoryData } from '~/types/public/index.type';


defineProps<{
  categories: CategoryData[]
  activeId:   string
}>()

const emit = defineEmits<{
  select:      [id: string]
  openFilters: []
}>()

const sf = useStorefront()
</script>

<template>
  <div class="pills-row">

    <button class="filter-pill" @click="emit('openFilters')">
      <Icon icon="solar:tuning-2-line-duotone" width="20" />
      <span v-if="sf.activeFiltersCount.value > 0" class="filter-count">
        {{ sf.activeFiltersCount.value }}
      </span>
    </button>

    <button
      class="cat-pill"
      :class="{ active: activeId === 'all' }"
      @click="emit('select', 'all')"
    >Tout</button>

    <button
      v-for="cat in categories"
      :key="cat.id"
      class="cat-pill"
      :class="{ active: activeId === cat.id }"
      @click="emit('select', cat.id)"
    >{{ cat.name }}</button>

  </div>
</template>

<style scoped>
.pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 24px 20px;
  overflow-x: auto;
  scrollbar-width: none;
}
.pills-row::-webkit-scrollbar { display: none; }

.filter-pill {
  flex-shrink: 0;
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface-variant));
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(var(--v-theme-on-surface));
}

.filter-count {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(var(--v-theme-secondary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgb(var(--v-theme-surface));
}

.cat-pill {
  flex-shrink: 0;
  padding: 10px 20px;
  border-radius: var(--r-full);
  background: rgb(var(--v-theme-surface-variant));
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
  transition: background .2s, color .2s;
  white-space: nowrap;
}
.cat-pill.active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
</style>