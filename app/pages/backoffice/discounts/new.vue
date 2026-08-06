<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useAdminDiscountCodesStore } from '~/stores/Models/discountCodes.store'
import type { DiscountCodeFormData } from '~/types/Models/discountCode.type'

definePageMeta({ layout: 'admin' })

const store = useAdminDiscountCodesStore()
const submitError = ref('')

async function onSubmit(data: DiscountCodeFormData) {
  submitError.value = ''
  const result = await store.createCode(data)

  if (!result) {
    submitError.value = store.error ?? 'Impossible de créer le code promo.'
    return
  }

  notify('Code promo créé avec succès.', 'success')
  navigateTo('/backoffice/discounts')
}
</script>

<template>
  <div>
    <UiBreadCrumbs :items="[
      { label: 'Codes promo', icon: 'solar:ticket-sale-line-duotone', to: '/backoffice/discounts' },
      { label: 'Nouveau code' },
    ]" />

    <v-expand-transition>
      <div v-if="submitError" class="error-block">
        <Icon icon="solar:danger-triangle-line-duotone" width="16" />
        {{ submitError }}
      </div>
    </v-expand-transition>

    <AdminDiscountCodeForm mode="create" :saving="store.saving" @submit="onSubmit" />
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