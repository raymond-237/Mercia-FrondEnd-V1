<script setup lang="ts">
import { useI18n } from 'vue-i18n'
// import { useStorefront, type SortOption } from '~/composables/useStorefront'

const { t } = useI18n()
const sf = useStorefront()

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'position',   label: 'Suggestions',           icon: 'solar:star-line-duotone' },
  { value: '-createdAt', label: 'Nouveautés',             icon: 'solar:magic-stick-3-line-duotone' },
  { value: 'price',      label: 'Prix croissant',         icon: 'solar:sort-vertical-line-duotone' },
  { value: '-price',     label: 'Prix décroissant',       icon: 'solar:sort-vertical-line-duotone' },
]

// Bornes locales du slider — initialisées depuis le vrai catalogue
// (sf.priceBounds), ajustées par la sélection utilisateur
const localRange = computed<[number, number]>({
  get: () => sf.priceRange.value ?? [
    sf.priceBounds.value?.min ?? 0,
    sf.priceBounds.value?.max ?? 500,
  ],
  set: (val) => sf.setPriceRange(val),
})

function onApply() { sf.closeDrawer() }
</script>

<template>
  <ui-off-canvas
    :model-value="sf.activeDrawer.value === 'filters'"
    orientation="right"
    size="sm"
    :persistent="false"
    @update:model-value="sf.closeDrawer()"
  >
    <div class="drawer-content">

      <div class="drawer-head">
        <span class="drawer-title">{{ t('filters.title') }}</span>
        <button class="close-btn" @click="sf.closeDrawer()">
          <Icon icon="solar:close-circle-duotone" class="text-error" width="25" />
        </button>
      </div>

      <div class="drawer-body">

        <!-- Tri — toujours disponible, indépendant du catalogue -->
        <div class="filter-group">
          <div class="group-label">{{ t('filters.sortBy') }}</div>
          <div class="sort-list">
            <button
              v-for="opt in SORT_OPTIONS"
              :key="opt.value"
              class="sort-option"
              :class="{ active: sf.sortBy.value === opt.value }"
              @click="sf.setSortBy(opt.value)"
            >
              <Icon :icon="opt.icon" width="18" />
              <span>{{ opt.label }}</span>
              <Icon
                v-if="sf.sortBy.value === opt.value"
                icon="solar:check-circle-bold-duotone"
                width="16"
                class="sort-check"
              />
            </button>
          </div>
        </div>

        <!-- Prix — donnée réelle, bornes issues du vrai catalogue -->
        <div v-if="sf.priceBounds.value" class="filter-group">
          <div class="group-label">
            {{ t('filters.price') }}
            <span class="option-selected">{{ localRange[0] }}€ – {{ localRange[1] }}€</span>
          </div>
          <v-range-slider
            v-model="localRange"
            :min="sf.priceBounds.value.min"
            :max="sf.priceBounds.value.max"
            :step="5"
            color="secondary"
            track-color="surface-variant"
            thumb-size="16"
            hide-details
          />
        </div>

        <!-- Couleur — swatches réels avec la vraie teinte -->
        <div v-if="sf.availableColors.value.length" class="filter-group">
          <div class="group-label">{{ t('filters.color') }}</div>
          <div class="swatch-row">
            <button
              v-for="c in sf.availableColors.value"
              :key="c.label"
              class="swatch-option"
              :class="{ active: sf.filters.value.color.includes(c.label) }"
              @click="sf.toggleFilter('color', c.label)"
            >
              <span class="swatch-dot" :style="{ background: c.hex }">
                <Icon
                  v-if="sf.filters.value.color.includes(c.label)"
                  icon="solar:check-circle-bold-duotone"
                  width="14"
                  class="swatch-check"
                />
              </span>
              <span class="swatch-label">{{ c.label }}</span>
            </button>
          </div>
        </div>

      </div>

      <div class="drawer-foot">
        <v-btn
          variant="tonal" rounded="pill"
          @click="sf.resetFilters()"
        >{{ t('filters.reset') }}</v-btn>
        <v-btn
          color="primary" variant="flat" rounded="pill"
          style="flex: 1;"
          @click="onApply"
        >
          {{ t('filters.seeResults') }}
          <span v-if="sf.activeFiltersCount.value > 0" class="filter-count-badge">
            {{ sf.activeFiltersCount.value }}
          </span>
        </v-btn>
      </div>

    </div>
  </ui-off-canvas>
</template>

<style scoped>
.drawer-content { display: flex; flex-direction: column; height: 100%; min-height: 0; }

.drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 20px 16px; border-bottom: 1px solid rgb(var(--v-theme-on-surface-variant)); flex-shrink: 0;
}
.drawer-title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; }
.close-btn { background: none; border: none; cursor: pointer; color: rgb(var(--v-theme-on-surface-variant)); display: flex; }

.drawer-body { flex: 1; overflow-y: auto; padding: 16px 20px; min-height: 0; }

.filter-group { margin-bottom: 28px; }
.group-label {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: rgb(var(--v-theme-secondary));
  margin-bottom: 14px;
}
.option-selected {
  font-size: 11px; font-weight: 700; letter-spacing: normal; text-transform: none;
  color: rgb(var(--v-theme-on-surface));
}

/* Tri */
.sort-list { display: flex; flex-direction: column; gap: 4px; }
.sort-option {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 11px 12px;
  background: transparent; border: none; border-radius: var(--r-md);
  cursor: pointer; text-align: left;
  color: rgb(var(--v-theme-on-surface-variant));
  transition: background .15s ease, color .15s ease;
}
.sort-option:hover { background: rgb(var(--v-theme-surface-variant)); }
.sort-option.active {
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface));
  font-weight: 700;
}
.sort-option span:first-of-type { flex: 1; font-size: 13px; }
.sort-check { color: rgb(var(--v-theme-secondary)); flex-shrink: 0; }

/* Couleur */
.swatch-row { display: flex; flex-wrap: wrap; gap: 14px; }
.swatch-option {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  width: 56px;
}
.swatch-dot {
  position: relative;
  width: 34px; height: 34px; border-radius: 50%;
  box-shadow: 0 0 0 1.5px rgb(var(--v-theme-outline));
  display: flex; align-items: center; justify-content: center;
  transition: box-shadow .2s ease, transform .15s ease;
}
.swatch-option:active .swatch-dot { transform: scale(0.9); }
.swatch-option.active .swatch-dot { box-shadow: 0 0 0 2px rgb(var(--v-theme-secondary)); }
.swatch-check { color: #FAFAF8; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5)); }
.swatch-label {
  font-size: 10px; font-weight: 600; text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.2;
  max-width: 56px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.swatch-option.active .swatch-label { color: rgb(var(--v-theme-on-surface)); }

.drawer-foot {
  padding: 16px 20px; border-top: 1px solid rgb(var(--v-theme-outline));
  display: flex; gap: 10px; flex-shrink: 0;
}
.filter-count-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  font-size: 10px; font-weight: 700; margin-left: 6px;
}
</style>