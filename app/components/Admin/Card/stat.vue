<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string
  icon: string
  trendLabel: string
  trendValue: string
  trendDirection: 'up' | 'down'
}>(), {})
</script>

<template>
  <div class="stat-card">
    <div class="stat-head">
      <div>
        <p class="stat-label">{{ label }}</p>
        <h3 class="stat-value">{{ value }}</h3>
      </div>
      <div class="stat-icon">
        <Icon :icon="icon" width="22" />
      </div>
    </div>
    <div class="stat-trend">
      <span class="stat-trend-label">{{ trendLabel }}</span>
      <span class="stat-trend-value" :class="trendDirection">
        <Icon :icon="trendDirection === 'up' ? 'solar:arrow-up-line-duotone' : 'solar:arrow-down-line-duotone'" width="18" />
        {{ trendValue }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl);
  padding: 20px;
}

.stat-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.stat-label { font-size: 12.5px; font-weight: 600; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 4px; }
.stat-value { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; }

.stat-icon {
  width: 42px; height: 42px; border-radius: var(--r-lg);
  background: rgba(var(--v-theme-secondary), 0.12);
  color: rgb(var(--v-theme-secondary));
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.stat-trend { display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; }
.stat-trend-label { color: rgb(var(--v-theme-on-surface-variant)); }
.stat-trend-value {
  display: flex; align-items: center; gap: 3px;
  font-weight: 700;
}
.stat-trend-value.up { color: #4C7A4C; }
.stat-trend-value.down { color: #C0533E; }
</style>