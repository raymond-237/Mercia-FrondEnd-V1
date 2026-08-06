<script setup lang="ts">
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { useI18n } from 'vue-i18n'

definePageMeta({ layout: 'public' })

const { t } = useI18n()

// ── Pas d'endpoint backend dédié pour l'instant (aucune route
// "contact"/"support" dans routes/api.php). En attendant sa création,
// le formulaire redirige vers un mailto avec les infos pré-remplies —
// simple, fonctionnel, et facile à remplacer par un vrai POST plus tard.

const validationSchema = computed(() => yup.object({
  name:    yup.string().required(t('contact.validation.nameRequired')),
  email:   yup.string().email(t('contact.validation.emailInvalid')).required(t('contact.validation.emailRequired')),
  subject: yup.string().required(t('contact.validation.subjectRequired')),
  message: yup.string().required(t('contact.validation.messageRequired')).min(10, t('contact.validation.messageTooShort')),
}))

const { handleSubmit } = useForm({ validationSchema })

const { value: name,    errorMessage: errName    } = useField<string>('name')
const { value: email,   errorMessage: errEmail   } = useField<string>('email')
const { value: subject, errorMessage: errSubject } = useField<string>('subject')
const { value: message, errorMessage: errMessage } = useField<string>('message')

const sent = ref(false)

const CONTACT_EMAIL = 'contact@afroextension.com' // TODO: remplacer par la vraie adresse

const onSubmit = handleSubmit((values) => {
  // TODO Module suivant : remplacer par un vrai POST /api/v1/contact
  // dès que l'endpoint existe côté backend.
  const body = encodeURIComponent(
    `${values.message}\n\n— ${values.name} (${values.email})`
  )
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(values.subject)}&body=${body}`

  if (import.meta.client) window.location.href = mailto
  sent.value = true
})
</script>

<template>
  <div>
    <LayoutsNavbar />

    <div class="content">

      <div class="page-header">
        <div class="page-icon">
          <Icon icon="solar:chat-round-dots-line-duotone" width="35" />
        </div>
        <h1>{{ t('contact.header.title') }}</h1>
        <p class="sub">{{ t('contact.header.subtitle') }}</p>
      </div>

      <!-- Canaux directs -->
      <div class="channels">
        <a href="https://wa.me/" target="_blank" rel="noopener" class="channel-card">
          <Icon icon="tabler:brand-whatsapp" width="28" />
          <span>{{ t('contact.channels.whatsapp') }}</span>
        </a>
        <a :href="`mailto:${CONTACT_EMAIL}`" class="channel-card">
          <Icon icon="solar:letter-line-duotone" width="28" />
          <span>{{ t('contact.channels.email') }}</span>
        </a>
      </div>

      <!-- Formulaire -->
      <form v-if="!sent" @submit.prevent="onSubmit" class="contact-form">
        <v-text-field
          v-model="name"
          :label="t('contact.form.name')"
          variant="solo-filled"
          flat rounded="xl"
          density="comfortable"
          :error-messages="errName"
          class="mb-3"
        >
          <template #prepend-inner>
            <Icon icon="solar:user-line-duotone" width="18" />
          </template>
        </v-text-field>
        <v-text-field
          v-model="email"
          :label="t('contact.form.email')"
          type="email"
          variant="solo-filled"
          flat rounded="xl"
          density="comfortable"
          :error-messages="errEmail"
          class="mb-3"
        >
          <template #prepend-inner>
            <Icon icon="solar:letter-line-duotone" width="18" />
          </template>
        </v-text-field>
        <v-text-field
          v-model="subject"
          :label="t('contact.form.subject')"
          variant="solo-filled"
          flat rounded="xl"
          density="comfortable"
          :error-messages="errSubject"
          class="mb-3"
        >
          <template #prepend-inner>
            <Icon icon="solar:bookmark-line-duotone" width="18" />
          </template>
        </v-text-field>
        <v-textarea
          v-model="message"
          :label="t('contact.form.message')"
          variant="solo-filled"
          flat rounded="xl"
          density="comfortable"
          rows="4"
          :error-messages="errMessage"
          class="mb-4"
        >
          <template #prepend-inner>
            <Icon icon="solar:chat-round-dots-line-duotone" width="18" />
          </template>
        </v-textarea>

        <v-btn type="submit" block rounded="pill" size="large" color="primary">
          {{ t('contact.form.submit') }}
          <Icon icon="solar:arrow-right-line-duotone" width="16" style="margin-left: 8px;" />
        </v-btn>
      </form>

      <!-- Confirmation -->
      <div v-else class="sent-state">
        <Icon icon="solar:check-circle-bold-duotone" width="40" style="color: #4C7A4C;" />
        <h2>{{ t('contact.sent.title') }}</h2>
        <p>{{ t('contact.sent.subtitle', { email: CONTACT_EMAIL }) }}</p>
      </div>

    </div>

    <LayoutsFooter />
  </div>
</template>

<style scoped>
.content { padding: 0 20px 48px; max-width: 480px; margin: 0 auto; }

.page-header { text-align: center; padding: 28px 0 24px; }
.page-icon {
  width: 52px; height: 52px; border-radius: var(--r-lg); margin: 0 auto 14px;
  background: rgb(var(--v-theme-surface-variant));
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary));
}
h1 { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 600; margin-bottom: 8px; }
.sub { font-size: 13px; color: rgb(var(--v-theme-on-surface-variant)); }

.channels { display: flex; gap: 12px; margin-bottom: 28px; }
.channel-card {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-xl); padding: 18px 12px;
  text-decoration: none; color: rgb(var(--v-theme-on-surface));
  font-size: 12.5px; font-weight: 600;
  transition: background .2s;
}
.channel-card:hover { background: rgb(var(--v-theme-outline)); }
.channel-card :deep(svg) { color: rgb(var(--v-theme-secondary)); }

.sent-state {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  gap: 12px; padding: 40px 0;
}
.sent-state h2 { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; }
.sent-state p { font-size: 13px; color: rgb(var(--v-theme-on-surface-variant)); max-width: 300px; }

@media (min-width: 960px) {
  .content { padding: 0 24px 60px; }
  h1 { font-size: 28px; }
}
</style>