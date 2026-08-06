<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SHIPPING_COUNTRIES, type CountryOption } from '~/@cores/constantes/countries';

const props = defineProps<{
  modelValue: string
  label: string
  errorMessages?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'keyup-enter': []
}>()

const { t } = useI18n()

const menu = ref(false)
const selectedCountry = ref<CountryOption>(
  SHIPPING_COUNTRIES.find(c => c.code === 'IT') ?? SHIPPING_COUNTRIES[0]
)
const nationalNumber = ref('')

function splitExistingValue(value: string) {
  if (!value) return
  const match = SHIPPING_COUNTRIES.find(c => value.trim().startsWith(c.dialCode))
  if (match) {
    selectedCountry.value = match
    nationalNumber.value  = value.trim().slice(match.dialCode.length).trim()
  } else {
    nationalNumber.value = value
  }
}

splitExistingValue(props.modelValue)

function emitCombined() {
  const combined = nationalNumber.value.trim()
    ? `${selectedCountry.value.dialCode} ${nationalNumber.value.trim()}`
    : ''
  emit('update:modelValue', combined)
}

function selectCountry(country: CountryOption) {
  selectedCountry.value = country
  menu.value = false
  emitCombined()
}

watch(nationalNumber, emitCombined)

watch(() => props.modelValue, (val) => {
  const combined = nationalNumber.value.trim()
    ? `${selectedCountry.value.dialCode} ${nationalNumber.value.trim()}`
    : ''
  if (val !== combined) splitExistingValue(val)
})
</script>

<template>
  <v-text-field
    v-model="nationalNumber"
    :label="label"
    type="tel"
    variant="solo-filled"
    flat rounded="xl"
    density="comfortable"
    :error-messages="errorMessages"
    autocomplete="tel-national"
    placeholder="345 678 9012"
    @keyup.enter="emit('keyup-enter')"
  >
    <template #prepend-inner>
      <v-menu v-model="menu" location="bottom start">
        <template #activator="{ props: menuProps }">
          <button
            type="button"
            class="dial-code-trigger"
            v-bind="menuProps"
            :aria-label="t('checkout.step1.selectDialCode')"
          >
            <img :src="selectedCountry.flagUrl" :alt="selectedCountry.code" class="flag-img">
            <span class="dial-code">{{ selectedCountry.dialCode }}</span>
            <Icon icon="solar:alt-arrow-down-line-duotone" width="12" />
          </button>
        </template>

        <div class="dial-code-list">
          <button
            v-for="c in SHIPPING_COUNTRIES"
            :key="c.code"
            type="button"
            class="dial-code-option"
            :class="{ active: c.code === selectedCountry.code }"
            @click="selectCountry(c)"
          >
            <img :src="c.flagUrl" :alt="c.code" class="flag-img">
            <span>{{ t(`checkout.step2.countries.${c.code.toLowerCase()}`) }}</span>
            <span class="dial-code-option-code">{{ c.dialCode }}</span>
          </button>
        </div>
      </v-menu>
    </template>
  </v-text-field>
</template>

<style scoped>
.dial-code-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding-right: 8px;
  border-right: 1px solid rgb(var(--v-theme-outline));
  margin-right: 8px;
  color: rgb(var(--v-theme-on-surface));
}

.flag-img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.dial-code {
  font-size: 12.5px;
  font-weight: 700;
}

.dial-code-list {
  background: rgb(var(--v-theme-surface));
  border-radius: var(--r-lg);
  padding: 6px;
  min-width: 200px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
}

.dial-code-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  background: none;
  border: none;
  border-radius: var(--r-sm);
  cursor: pointer;
  text-align: left;
  font-size: 12.5px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  transition: background .15s ease;
}
.dial-code-option:hover { background: rgb(var(--v-theme-surface-variant)); }
.dial-code-option.active { background: rgb(var(--v-theme-surface-variant)); color: rgb(var(--v-theme-secondary)); }
.dial-code-option span:nth-child(2) { flex: 1; }
.dial-code-option-code { font-weight: 700; color: rgb(var(--v-theme-on-surface-variant)); }
</style>