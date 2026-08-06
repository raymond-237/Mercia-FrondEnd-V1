<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useAdminTaxRatesStore } from '~/stores/Models/taxrates.stores'
import type { TaxRateFormData } from '~/types/Models/taxRate.type'

definePageMeta({ layout: 'admin' })

const store = useAdminTaxRatesStore()
const submitError = ref('')

async function onSubmit(data: TaxRateFormData) {
  submitError.value = ''
  const result = await store.createRate(data)
  if (!result) {
    submitError.value = store.error ?? 'Impossible de créer le taux.'
    return
  }
  notify('Taux de taxe créé avec succès.', 'success')
  navigateTo('/backoffice/taxrates')
}
</script>

<template>
  <div>
    <UiBreadCrumbs :items="[
      { label: 'Taux de taxe', icon: 'solar:calculator-line-duotone', to: '/backoffice/taxrates' },
      { label: 'Nouveau taux' },
    ]" />

    <v-expand-transition>
      <div v-if="submitError" class="error-block">
        <Icon icon="solar:danger-triangle-line-duotone" width="16" />
        {{ submitError }}
      </div>
    </v-expand-transition>

    <AdminTaxRateForm mode="create" :saving="store.saving" @submit="onSubmit" />
  </div>
</template>

<style scoped>
.error-block {
  display: flex; align-items: center; gap: 8px;
  background: rgba(192, 83, 62, 0.1); color: #C0533E;
  border-radius: var(--r-lg); padding: 12px;
  font-size: 12.5px; font-weight: 600; margin-bottom: 16px;
}
</style>