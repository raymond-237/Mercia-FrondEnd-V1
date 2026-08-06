<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SHIPPING_COUNTRIES } from '~/@cores/constantes/countries'

const props = withDefaults(defineProps<{
  modelValue: string | null
  label?: string
  errorMessages?: string | string[]
  i18nPrefix?: string
}>(), {
  label: undefined,
  errorMessages: () => [],
  // Préfixe des clés i18n pour le libellé de chaque pays — permet de
  // réutiliser ce composant ailleurs qu'au checkout sans dépendre de
  // checkout.step2.countries.* si un autre contexte a ses propres clés.
  i18nPrefix: 'checkout.step2.countries',
})

const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const { t } = useI18n()

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const countryOptions = computed(() =>
  SHIPPING_COUNTRIES.map(c => ({
    title:   t(`${props.i18nPrefix}.${c.code.toLowerCase()}`),
    value:   c.code,
    flagUrl: c.flagUrl,
  }))
)

function findCountryFlag(code: string): string | undefined {
  return SHIPPING_COUNTRIES.find(c => c.code === code)?.flagUrl
}
</script>

<template>
  <v-select
    v-model="value"
    :label="label"
    variant="solo-filled" flat rounded="xl" density="comfortable"
    :error-messages="errorMessages"
    :items="countryOptions"
    autocomplete="country"
  >
    <template #prepend-inner>
      <Icon icon="solar:global-line-duotone" width="18" />
    </template>

    <template #selection="{ item }">
      <template v-if="item">
        <img :src="findCountryFlag(item.value)" :alt="item.value" class="country-flag">
        {{ item.title }}
      </template>
    </template>

    <template #item="{ item, props: itemProps }">
      <v-list-item v-bind="itemProps">
        <template #prepend>
          <img :src="findCountryFlag(item.value)" :alt="item.value" class="country-flag">
        </template>
      </v-list-item>
    </template>
  </v-select>
</template>

<style scoped>
.country-flag {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}
</style>