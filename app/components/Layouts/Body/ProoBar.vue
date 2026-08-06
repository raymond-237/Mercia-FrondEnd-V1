<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import type { ProofStat } from '~/types/public/index.type'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{ stats?: ProofStat[] }>(),
  { stats: undefined }
)

const defaultStats = computed<ProofStat[]>(() => [
  { icon: 'solar:users-group-rounded-line-duotone', value: t('home.proofBar.stat1.value'), label: t('home.proofBar.stat1.label') },
  { icon: 'solar:star-line-duotone',                value: t('home.proofBar.stat2.value'), label: t('home.proofBar.stat2.label') },
  { icon: 'solar:like-line-duotone',                value: t('home.proofBar.stat3.value'), label: t('home.proofBar.stat3.label') },
  { icon: 'solar:delivery-line-duotone',            value: t('home.proofBar.stat4.value'), label: t('home.proofBar.stat4.label') },
])

const displayedStats = computed(() => props.stats ?? defaultStats.value)
</script>

<template>
  <div class="proof-bar">
    <div v-for="stat in displayedStats" :key="stat.value" class="proof-item">
      <div class="proof-value">
        <Icon :icon="stat.icon" width="24" />
        {{ stat.value }}
      </div>
      <div class="proof-label">{{ stat.label }}</div>
    </div>
  </div>
</template>

<style scoped>
.proof-bar {
  margin: 0 16px 20px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg);
  padding: 18px 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  row-gap: 18px;
  column-gap: 8px;
}

.proof-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.proof-value {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 700;
  color: rgb(var(--v-theme-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-bottom: 2px;
  white-space: nowrap;
}

.proof-label {
  font-size: 10.5px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.3;
}

@media (min-width: 960px) {
  .proof-bar {
    margin: 0 24px 28px;
    padding: 18px 24px;
    grid-template-columns: repeat(4, 1fr);
    row-gap: 0;
    column-gap: 16px;
  }

  .proof-value { font-size: 22px; }
  .proof-value :deep(svg) { width: 30px; height: 30px; }
  .proof-label { font-size: 11px; }
}
</style>