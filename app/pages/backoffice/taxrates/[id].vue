<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useAdminTaxRatesStore } from '~/stores/Models/taxrates.stores'
import type { TaxRateFormData } from '~/types/Models/taxRate.type'


const route = useRoute()
definePageMeta({ layout: 'admin' })

const store = useAdminTaxRatesStore()
const loading      = ref(true)
const notFound     = ref(false)
const rate         = ref<any>(null)
const submitError  = ref('')
const deleteDialog = ref(false)

const initialData = computed<Partial<TaxRateFormData> | undefined>(() => {
  if (!rate.value) return undefined
  return {
    name: rate.value.name,
    rate: rate.value.rate,
    countryCode: rate.value.countryCode,
    isDefault: rate.value.isDefault,
    isActive: rate.value.isActive,
  }
})

const loadRate = async () => {
  const data = await store.fetchRate(route.params.id as string)
  if (!data) { notFound.value = true; loading.value = false; return }
  rate.value = data
  loading.value = false
}
onMounted(loadRate)

async function onSubmit(data: TaxRateFormData) {
  submitError.value = ''
  const result = await store.updateRate(route.params.id as string, data)
  if (!result) {
    submitError.value = store.error ?? 'Impossible de modifier le taux.'
    return
  }
  rate.value = result
  notify('Taux de taxe modifié avec succès.', 'success')
}

async function onDelete() {
  const success = await store.deleteRate(route.params.id as string)
  deleteDialog.value = false
  if (success) {
    notify('Taux supprimé.', 'success')
    navigateTo('/backoffice/tax-rates')
  } else {
    notify('Une erreur est survenue.', 'error')
  }
}
</script>

<template>
  <div>
    <UiBreadCrumbs :items="[
      { label: 'Taux de taxe', icon: 'solar:calculator-line-duotone', to: '/backoffice/taxrates' },
      { label: rate?.name ?? 'Modifier' },
    ]">
      <v-btn v-if="rate" variant="tonal" color="error" rounded="xl" @click="deleteDialog = true">
        <Icon icon="solar:trash-bin-trash-line-duotone" width="16" style="margin-right: 6px;" />
        Supprimer
      </v-btn>
    </UiBreadCrumbs>

    <div v-if="loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <div v-else-if="notFound" class="empty-block">
      <Icon icon="solar:calculator-line-duotone" width="65" />
      <p>Taux introuvable.</p>
    </div>

    <template v-else>
      <v-expand-transition>
        <div v-if="submitError" class="error-block">
          <Icon icon="solar:danger-triangle-line-duotone" width="16" />
          {{ submitError }}
        </div>
      </v-expand-transition>

      <AdminTaxRateForm mode="edit" :initial-data="initialData" :saving="store.saving" @submit="onSubmit" />
    </template>

    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="text-body-1 font-weight-bold">Supprimer ce taux ?</v-card-title>
        <v-card-text class="text-body-2">"{{ rate?.name }}" sera définitivement supprimé.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Annuler</v-btn>
          <v-btn color="error" variant="flat" rounded="xl" @click="onDelete">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.loading-block, .empty-block {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px 0; color: rgb(var(--v-theme-on-surface-variant));
}
.error-block {
  display: flex; align-items: center; gap: 8px;
  background: rgba(192, 83, 62, 0.1); color: #C0533E;
  border-radius: var(--r-lg); padding: 12px;
  font-size: 12.5px; font-weight: 600; margin-bottom: 16px;
}
</style>