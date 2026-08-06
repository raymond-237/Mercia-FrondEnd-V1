<script setup lang="ts">
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { useI18n } from 'vue-i18n'
import { useOrdersStore } from '~/stores/Models/order.store'
import type { TrackingResult } from '~/types/Models/Ordertracking'

definePageMeta({ layout: 'form' })

const { t } = useI18n()
const ordersStore = useOrdersStore()

const validationSchema = computed(() => yup.object({
  orderNumber: yup.string().required(t('order.validation.orderNumberRequired')),
  email:       yup.string().email(t('order.validation.emailInvalid')).required(t('order.validation.emailRequired')),
}))

const { handleSubmit } = useForm({ validationSchema })

const { value: orderNumber, errorMessage: errOrder } = useField<string>('orderNumber')
const { value: email,       errorMessage: errEmail } = useField<string>('email')

const loading = ref(false)
const error   = ref('')

// Partagé avec la page résultat via useState — évite de toucher au store
// Pinia pour un simple transfert d'état entre deux pages du même flow.
const trackingResult = useState<TrackingResult | null>('orderTrackingResult', () => null)

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  error.value   = ''

  const data = await ordersStore.fetchOrderTracking(values.orderNumber, values.email)

  if (data) {
    trackingResult.value = mapTrackingResult(data)

    // Permet à la page résultat de se recharger elle-même si l'utilisateur
    // rafraîchit directement dessus (useState seul ne survit pas à un reload).
    if (import.meta.client) {
      sessionStorage.setItem('orderTrackingQuery', JSON.stringify({
        orderNumber: values.orderNumber,
        email: values.email,
      }))
    }

    await navigateTo('/tracking/result')
  } else {
    error.value = ordersStore.trackingError ?? t('order.tracking.notFound')
  }

  loading.value = false
})
</script>

<template>
  <div class="tracking-page">
    <div class="content">
      <div class="tracking-wrapper">

        <div class="page-icon">
          <Icon icon="solar:delivery-line-duotone" width="35" />
        </div>
        <h1>{{ t('order.tracking.title') }}</h1>
        <p class="sub">{{ t('order.tracking.subtitle') }}</p>

        <form @submit.prevent="onSubmit">
          <v-text-field
            v-model="orderNumber"
            :label="t('order.tracking.orderNumber')"
            :placeholder="t('order.tracking.orderNumberPlaceholder')"
            variant="solo-filled"
            flat rounded="xl"
            density="comfortable"
            :error-messages="errOrder"
            autocomplete="off"
            class="mb-3"
          >
            <template #prepend-inner>
              <Icon icon="solar:bill-list-line-duotone" width="18" />
            </template>
          </v-text-field>
          <v-text-field
            v-model="email"
            :label="t('order.tracking.email')"
            type="email"
            variant="solo-filled"
            flat rounded="xl"
            density="comfortable"
            :error-messages="errEmail"
            autocomplete="email"
            class="mb-4"
          >
            <template #prepend-inner>
              <Icon icon="solar:letter-line-duotone" width="18" />
            </template>
          </v-text-field>

          <v-btn
            type="submit" block rounded="pill" size="large" color="primary"
            :loading="loading"
          >
            {{ t('order.tracking.search') }}
            <Icon icon="solar:magnifer-line-duotone" width="16" style="margin-left: 6px;" />
          </v-btn>
        </form>

        <v-expand-transition>
          <div v-if="error" class="error-block">
            <Icon icon="solar:danger-triangle-line-duotone" width="18" />
            {{ error }}
          </div>
        </v-expand-transition>

      </div>
    </div>
  </div>
</template>

<style scoped>
.tracking-page {}
.content { padding: 0 24px 40px; }

.tracking-wrapper { max-width: 420px; margin: 32px auto; }

.page-icon {
  width: 56px; height: 56px; border-radius: var(--r-lg);
  background: rgb(var(--v-theme-surface-variant));
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary)); margin-bottom: 16px;
}
h1 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; margin-bottom: 6px; }
.sub { font-size: 13px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 24px; }

.error-block {
  display: flex; align-items: center; gap: 8px;
  background: rgba(192, 83, 62, 0.1);
  color: #C0533E; border-radius: var(--r-lg); padding: 14px;
  font-size: 13px; font-weight: 600; margin-top: 16px;
}
</style>