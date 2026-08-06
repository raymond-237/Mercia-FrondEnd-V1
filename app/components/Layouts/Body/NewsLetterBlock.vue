<script setup lang="ts">
const { t } = useI18n()

import { Icon } from '@iconify/vue'
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { useI18n } from 'vue-i18n';

const emit = defineEmits<{ subscribe: [email: string] }>()

const { handleSubmit } = useForm({
    validationSchema: yup.object({
        email: yup.string()
            .email(t('common.validation.emailInvalid'))
            .required(t('common.validation.required')),
    }),
})

const { value: email, errorMessage } = useField<string>('email')

const submitted = ref(false)

const onSubmit = handleSubmit((values) => {
  emit('subscribe', values.email)
  submitted.value = true
})
</script>

<template>
  <div class="newsletter">
    <div class="glow" />

    <Transition name="fade" mode="out-in">

      <div v-if="!submitted" key="form" class="newsletter-inner">
        <h3>{{ t('home.newsletter.title') }}</h3>
        <p>{{ t('home.newsletter.subtitle') }}</p>

        <form class="form" @submit.prevent="onSubmit">
          <v-text-field
              v-model="email"
              type="email"
              :placeholder="t('home.newsletter.placeholder')"
              variant="solo-filled"
              flat
              rounded="pill"
              density="comfortable"
              hide-details
              :error="!!errorMessage"
          >
              <template #append-inner>
                  <v-btn size="small" variant="flat" rounded="pill" color="primary" type="submit">
                      {{ t('home.newsletter.submit') }}
                  </v-btn>
              </template>
         </v-text-field>
          <p v-if="errorMessage" class="field-error">{{ errorMessage }}</p>
          <p class="micro-copy">
            <Icon icon="solar:lock-keyhole-duotone" width="11" />
            {{ t('home.newsletter.microCopy') }}
        </p>
        </form>
      </div>

      <div v-else key="success" class="success-state">
        <Icon icon="solar:check-circle-duotone" width="36" />
         <h3>{{ t('home.newsletter.success.title') }}</h3>
         <p>{{ t('home.newsletter.success.subtitle') }}</p>
      </div>

    </Transition>
  </div>
</template>

<style scoped>
.newsletter {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-xl);
  padding: 44px 36px;
  text-align: center;
  position: relative;
  overflow: hidden;
  margin-bottom: 8px;
}
.glow {
  position: absolute; width: 240px; height: 240px;
  background: radial-gradient(circle, #C68A52 0%, transparent 70%);
  opacity: 0.1; border-radius: 50%; top: -80px; right: -60px; pointer-events: none;
}

.newsletter-inner { position: relative; }

h3 { font-family: 'Fraunces', serif; font-size: clamp(18px, 2.4vw, 24px); font-weight: 500; margin-bottom: 8px; }
p { color: rgb(var(--v-theme-on-surface-variant)); font-size: 13px; max-width: 380px; margin: 0 auto 20px; }

.form { max-width: 380px; margin: 0 auto; }
.field-error { font-size: 11.5px; color: #C0533E; margin-top: 6px; }
.micro-copy {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 10px;
}

.success-state {
  display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative;
  color: #4C7A4C;
}
.success-state h3 { color: rgb(var(--v-theme-on-surface)); }
.success-state p { margin-bottom: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity .25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .newsletter { padding: 32px 20px; }
}
</style>