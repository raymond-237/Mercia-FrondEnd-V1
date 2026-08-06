<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  modelValue: string
  label: string
  errorMessages?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select': [address: { addressLine1: string; city: string; postalCode: string; countryCode: string }]
}>()

const suggestions = ref<any[]>([])
const showSuggestions = ref(false)
const loading = ref(false)
const apiUnavailable = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Photon (Komoot) — API de géocodage gratuite basée sur
 * OpenStreetMap, sans clé, pensée pour l'autocomplete en direct.
 * En cas d'échec (réseau, panne du service), l'utilisateur garde
 * simplement une saisie manuelle classique — jamais bloquant.
 */
async function fetchSuggestions(query: string) {
  if (query.trim().length < 4) {
    suggestions.value = []
    return
  }

  loading.value = true
  try {
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=fr`
    )
    if (!response.ok) throw new Error('Photon unavailable')

    const json = await response.json()
    suggestions.value = json.features ?? []
    apiUnavailable.value = false
  } catch (e) {
    console.error('Autocomplete adresse indisponible (dégradation en saisie manuelle):', e)
    suggestions.value = []
    apiUnavailable.value = true
  } finally {
    loading.value = false
  }
}

function onInput(value: string) {
  emit('update:modelValue', value)
  showSuggestions.value = true

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchSuggestions(value), 350)
}

function selectSuggestion(feature: any) {
  const props = feature.properties
  const streetLine = [props.housenumber, props.street].filter(Boolean).join(' ') || props.name || ''

  emit('update:modelValue', streetLine)
  emit('select', {
    addressLine1: streetLine,
    city:         props.city ?? props.locality ?? '',
    postalCode:   props.postcode ?? '',
    countryCode:  (props.countrycode ?? '').toUpperCase(),
  })

  suggestions.value    = []
  showSuggestions.value = false
}

function onBlur() {
  // Petit délai pour laisser le clic sur une suggestion s'exécuter
  // avant de fermer la liste (sinon le blur ferme avant le click).
  setTimeout(() => { showSuggestions.value = false }, 150)
}
</script>

<template>
  <div class="address-autocomplete">
    <v-text-field
      :model-value="modelValue"
      :label="label"
      variant="solo-filled"
      flat rounded="xl"
      density="comfortable"
      :error-messages="errorMessages"
      autocomplete="street-address"
      @update:model-value="onInput"
      @focus="showSuggestions = true"
      @blur="onBlur"
    >
      <template #prepend-inner>
        <Icon icon="solar:map-point-line-duotone" width="18" />
      </template>
      <template #append-inner>
        <v-progress-circular v-if="loading" size="16" width="2" indeterminate color="secondary" />
      </template>
    </v-text-field>

    <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-panel">
      <button
        v-for="(feature, i) in suggestions"
        :key="i"
        class="suggestion-item"
        @mousedown.prevent="selectSuggestion(feature)"
      >
        <Icon icon="solar:map-point-line-duotone" width="15" />
        <span>
          {{ [feature.properties.housenumber, feature.properties.street, feature.properties.city].filter(Boolean).join(', ') || feature.properties.name }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.address-autocomplete { position: relative; }

.suggestions-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  z-index: 20;
  background: rgb(var(--v-theme-surface));
  border-radius: var(--r-lg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
  overflow: hidden;
  max-height: 240px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 11px 14px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 12.5px;
  color: rgb(var(--v-theme-on-surface));
  transition: background .15s ease;
}
.suggestion-item:hover { background: rgb(var(--v-theme-surface-variant)); }
.suggestion-item :deep(svg) { color: rgb(var(--v-theme-secondary)); flex-shrink: 0; }
</style>