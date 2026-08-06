<script setup lang="ts">
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { useI18n } from 'vue-i18n'
import { useReturnsStore } from '~/stores/Models/returns.store'

definePageMeta({ layout: 'form' })

const { t } = useI18n()
const returnsStore = useReturnsStore()

const validationSchema = computed(() => yup.object({
  orderNumber: yup.string().required(t('returns.validation.orderNumberRequired')),
  email:       yup.string().email(t('returns.validation.emailInvalid')).required(t('returns.validation.emailRequired')),
}))

const { handleSubmit } = useForm({ validationSchema })

const { value: orderNumber, errorMessage: errOrder } = useField<string>('orderNumber')
const { value: email,       errorMessage: errEmail } = useField<string>('email')

const loading = ref(false)

const onSubmit = handleSubmit(async (values) => {
  loading.value = true

  const success = await returnsStore.lookupOrder(values.orderNumber, values.email)

  if (success) {
    await navigateTo('/returns/new')
  }

  loading.value = false
})
</script>

<template>
  <div class="returns-wrapper">

    <div class="page-icon">
      <Icon icon="solar:undo-left-line-duotone" width="26" />
    </div>
    <h1>{{ t('returns.lookup.title') }}</h1>
    <p class="sub">{{ t('returns.lookup.subtitle') }}</p>

    <form @submit.prevent="onSubmit">
      <v-text-field
        v-model="orderNumber"
        :label="t('returns.lookup.orderNumber')"
        :placeholder="t('returns.lookup.orderNumberPlaceholder')"
        variant="solo-filled"
        flat rounded="xl"
        density="comfortable"
        :error-messages="errOrder"
        class="mb-3"
      >
        <template #prepend-inner>
          <Icon icon="solar:bill-list-line-duotone" width="18" />
        </template>
      </v-text-field>
      <v-text-field
        v-model="email"
        :label="t('returns.lookup.email')"
        type="email"
        variant="solo-filled"
        flat rounded="xl"
        density="comfortable"
        :error-messages="errEmail"
        class="mb-4"
      >
        <template #prepend-inner>
          <Icon icon="solar:letter-line-duotone" width="18" />
        </template>
      </v-text-field>

      <v-expand-transition>
        <div v-if="returnsStore.error" class="error-block">
          <Icon icon="solar:danger-triangle-line-duotone" width="16" />
          {{ returnsStore.error }}
        </div>
      </v-expand-transition>

      <v-btn
        type="submit" block rounded="pill" size="large" color="primary"
        :loading="loading" class="mt-4"
      >
        {{ t('returns.lookup.submit') }}
        <Icon icon="solar:arrow-right-line-duotone" width="16" style="margin-left: 6px;" />
      </v-btn>
    </form>

  </div>
</template>

<style scoped>
.returns-wrapper { width: 100%; max-width: 420px; }

.page-icon {
  width: 52px; height: 52px; border-radius: var(--r-lg);
  background: rgb(var(--v-theme-surface-variant));
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary)); margin-bottom: 14px;
}
h1 { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; margin-bottom: 6px; }
.sub { font-size: 12.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 22px; }

.error-block {
  display: flex; align-items: center; gap: 8px;
  background: rgba(192, 83, 62, 0.1); color: #C0533E;
  border-radius: var(--r-lg); padding: 12px;
  font-size: 12.5px; font-weight: 600; margin-bottom: 4px;
}

@media (min-width: 960px) {
  h1 { font-size: 22px; }
  .sub { margin-bottom: 24px; }
}
</style>