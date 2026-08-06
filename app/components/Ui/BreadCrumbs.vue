<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Crumb {
  label: string
  icon?: string
  to?: string
}

const props = defineProps<{
  items: Crumb[]
}>()

// Fil complet, avec Dashboard toujours en tête
const fullTrail = computed<Crumb[]>(() => [
  { label: 'Dashboard', icon: 'solar:home-2-line-duotone', to: '/backoffice' },
  ...props.items,
])

// Mobile : uniquement le parent direct (retour) + la page actuelle
const previousCrumb = computed(() => fullTrail.value[fullTrail.value.length - 2])
const currentCrumb  = computed(() => fullTrail.value[fullTrail.value.length - 1])
</script>

<template>
  <div class="breadcrumb-bar">

    <nav class="breadcrumbs" aria-label="Fil d'Ariane">

      <!-- Mobile — retour + page actuelle uniquement -->
      <div class="crumbs-mobile">
        <NuxtLink v-if="previousCrumb?.to" :to="previousCrumb.to" class="back-btn">
          <Icon icon="solar:alt-arrow-left-line-duotone" width="17" />
        </NuxtLink>
        <div class="current-mobile">
          <span v-if="currentCrumb.icon" class="current-icon">
            <Icon :icon="currentCrumb.icon" width="25" />
          </span>
          <span class="current-label">{{ currentCrumb.label }}</span>
        </div>
      </div>

      <!-- Desktop — fil complet -->
      <ol class="crumbs-desktop">
        <li v-for="(crumb, i) in fullTrail" :key="i" class="crumb">
          <NuxtLink v-if="crumb.to && i < fullTrail.length - 1" :to="crumb.to" class="crumb-link">
            <Icon v-if="crumb.icon" :icon="crumb.icon" width="25" />
            <span>{{ crumb.label }}</span>
          </NuxtLink>
          <span v-else class="crumb-current">
            <Icon v-if="crumb.icon" :icon="crumb.icon" width="25" />
            <span>{{ crumb.label }}</span>
          </span>

          <Icon
            v-if="i < fullTrail.length - 1"
            icon="solar:alt-arrow-right-line-duotone"
            width="12"
            class="crumb-sep"
          />
        </li>
      </ol>

    </nav>

    <!-- Zone d'actions — chaque page y glisse son bouton principal -->
    <div v-if="$slots.default" class="breadcrumb-actions">
      <slot />
    </div>

  </div>
</template>

<style scoped>
.breadcrumb-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-lg);
  padding: 12px 16px;
  margin-bottom: 20px;
}

.breadcrumb-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Mobile first ─────────────────────────────────────────── */
.crumbs-mobile {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.back-btn {
  width: 30px; height: 30px; border-radius: 50%;
  background: rgb(var(--v-theme-surface-variant));
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  flex-shrink: 0;
  transition: background .2s;
}
.back-btn:hover { background: rgb(var(--v-theme-outline)); }

.current-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.current-icon {
  width: 28px; height: 28px; border-radius: var(--r-sm); flex-shrink: 0;
  background: rgba(var(--v-theme-secondary), 0.12);
  color: rgb(var(--v-theme-secondary));
  display: flex; align-items: center; justify-content: center;
}
.current-label {
  font-size: 13.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crumbs-desktop { display: none; }

/* ── Desktop ─────────────────────────────────────────────── */
@media (min-width: 960px) {
  .breadcrumb-bar { padding: 10px 18px; }

  .crumbs-mobile { display: none; }

  .crumbs-desktop {
    display: flex;
    align-items: center;
    list-style: none;
    padding: 0;
    margin: 0;
    flex-wrap: wrap;
  }

  .crumb {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .crumb-link {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 600;
    color: rgb(var(--v-theme-on-surface-variant));
    text-decoration: none;
    padding: 5px 9px;
    border-radius: var(--r-sm);
    transition: background .2s, color .2s;
  }
  .crumb-link:hover {
    background: rgb(var(--v-theme-surface-variant));
    color: rgb(var(--v-theme-on-surface));
  }
  .crumb-link :deep(svg) { color: rgb(var(--v-theme-secondary)); flex-shrink: 0; }

  .crumb-current {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 700;
    color: rgb(var(--v-theme-on-surface));
    padding: 5px 9px;
  }
  .crumb-current :deep(svg) { color: rgb(var(--v-theme-secondary)); flex-shrink: 0; }

  .crumb-sep {
    color: rgba(var(--v-theme-on-surface), 0.28);
    flex-shrink: 0;
  }
}
</style>