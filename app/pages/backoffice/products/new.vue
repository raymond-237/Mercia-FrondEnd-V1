<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useProductsStore } from '~/stores/Models/products.store'
import type { ProductFormData } from '~/types/Models/product.type'

const productsStore = useProductsStore()
const submitError = ref('')

definePageMeta({
  layout: 'admin',
})

async function onSubmit(data: ProductFormData) {
  submitError.value = ''
  const result = await productsStore.createProduct(data)

  if (!result) {
    submitError.value = productsStore.error ?? 'Impossible de créer le produit.'
    return
  }

  notify('Produit créé avec succès.', 'success')
  navigateTo(`/backoffice/products/${result.slug}`)
}
</script>

<template>
  <div>
    <UiBreadCrumbs :items="[
      { label: 'Produits', icon: 'solar:box-line-duotone', to: '/backoffice/products' },
      { label: 'Nouveau produit' },
    ]" />

    <v-expand-transition>
      <div v-if="submitError" class="error-block">
        <Icon icon="solar:danger-triangle-line-duotone" width="16" />
        {{ submitError }}
      </div>
    </v-expand-transition>

    <AdminProductForm mode="create" :saving="productsStore.saving" @submit="onSubmit" />
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