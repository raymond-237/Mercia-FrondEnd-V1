<script setup lang="ts">


defineProps<{
  modelValue: string
  label: string
  errorMessages?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select': [address: AddressSuggestion]
}>()

const addressStore = useAddressStore()
const showSuggestions = ref(false)

function onInput(value: string) {
  emit('update:modelValue', value)
  showSuggestions.value = true
  addressStore.search(value)
}

function selectSuggestion(suggestion: AddressSuggestion) {
  emit('update:modelValue', suggestion.addressLine1)
  emit('select', suggestion)
  addressStore.clear()
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
        <v-progress-circular v-if="addressStore.loading" size="16" width="2" indeterminate color="secondary" />
      </template>
    </v-text-field>

    <div v-if="showSuggestions && addressStore.suggestions.length > 0" class="suggestions-panel">
      <button
        v-for="(suggestion, i) in addressStore.suggestions"
        :key="i"
        class="suggestion-item"
        @mousedown.prevent="selectSuggestion(suggestion)"
      >
        <Icon icon="solar:map-point-line-duotone" width="15" />
        <span>{{ suggestion.label }}</span>
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