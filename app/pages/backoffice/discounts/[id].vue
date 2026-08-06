<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useAdminDiscountCodesStore } from '~/stores/Models/discountCodes.store'
import type { DiscountCodeFormData } from '~/types/Models/discountCode.type'

const route = useRoute()
definePageMeta({ layout: 'admin' })

const store = useAdminDiscountCodesStore()

const loading    = ref(true)
const notFound   = ref(false)
const code       = ref<any>(null)
const submitError = ref('')
const deleteDialog = ref(false)

const initialData = computed<Partial<DiscountCodeFormData> | undefined>(() => {
  if (!code.value) return undefined
  return {
    code: code.value.code,
    type: code.value.type,
    value: code.value.value,
    appliesTo: code.value.appliesTo,
    appliesToId: code.value.appliesToId,
    minOrderAmount: code.value.minOrderAmount,
    maxUses: code.value.maxUses,
    isActive: code.value.isActive,
    startsAt: code.value.startsAt,
    expiresAt: code.value.expiresAt,
  }
})

const loadCode = async () => {
  const data = await store.fetchCode(route.params.id as string)
  if (!data) { notFound.value = true; loading.value = false; return }
  code.value = data
  loading.value = false
}
onMounted(loadCode)

async function onSubmit(data: DiscountCodeFormData) {
  submitError.value = ''
  const result = await store.updateCode(route.params.id as string, data)
  if (!result) {
    submitError.value = store.error ?? 'Impossible de modifier le code promo.'
    return
  }
  code.value = result
  notify('Code promo modifié avec succès.', 'success')
}

async function onDelete() {
  const success = await store.deleteCode(route.params.id as string)
  deleteDialog.value = false
  if (success) {
    notify('Code promo supprimé.', 'success')
    navigateTo('/backoffice/discounts')
  } else {
    notify('Impossible de supprimer — ce code est peut-être déjà utilisé dans des commandes.', 'error')
  }
}
</script>

<template>
  <div>
    <UiBreadCrumbs :items="[
      { label: 'Codes promo', icon: 'solar:ticket-sale-line-duotone', to: '/backoffice/discounts' },
      { label: code?.code ?? 'Modifier' },
    ]">
      <v-btn v-if="code" variant="tonal" color="error" rounded="xl" @click="deleteDialog = true">
        <Icon icon="solar:trash-bin-trash-line-duotone" width="16" style="margin-right: 6px;" />
        Supprimer
      </v-btn>
    </UiBreadCrumbs>

    <div v-if="loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <div v-else-if="notFound" class="empty-block">
      <Icon icon="solar:ticket-sale-line-duotone" width="36" />
      <p>Code promo introuvable.</p>
    </div>

    <template v-else>
      <v-expand-transition>
        <div v-if="submitError" class="error-block">
          <Icon icon="solar:danger-triangle-line-duotone" width="16" />
          {{ submitError }}
        </div>
      </v-expand-transition>

      <div v-if="code.usedCount > 0" class="usage-notice">
        <Icon icon="solar:info-circle-line-duotone" width="16" />
        Ce code a déjà été utilisé {{ code.usedCount }} fois — le modifier n'affecte pas les commandes passées.
      </div>

      <AdminDiscountCodeForm mode="edit" :initial-data="initialData" :saving="store.saving" @submit="onSubmit" />
    </template>

    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="text-body-1 font-weight-bold">Supprimer ce code ?</v-card-title>
        <v-card-text class="text-body-2">
          "{{ code?.code }}" sera définitivement supprimé. Cette action est irréversible.
        </v-card-text>
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
.usage-notice {
  display: flex; align-items: center; gap: 8px;
  background: rgba(110, 143, 184, 0.1); color: #6E8FB8;
  border-radius: var(--r-lg); padding: 12px;
  font-size: 12.5px; font-weight: 600; margin-bottom: 16px;
}
</style>