<script setup lang="ts">
import { Icon } from '@iconify/vue'
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { notify } from '~/@cores/constantes/helpers'

definePageMeta({ layout: 'auth', auth: false })

const { signIn } = useAuthentication()
const router = useRouter()
const route = useRoute()

const { handleSubmit } = useForm({
  validationSchema: yup.object({
    email:    yup.string().email('Email invalide').required('Email requis'),
    password: yup.string().required('Mot de passe requis'),
  }),
})

const { value: email,    errorMessage: errEmail    } = useField<string>('email')
const { value: password, errorMessage: errPassword } = useField<string>('password')

const loading      = ref(false)
const loginError   = ref('')
const showPassword = ref(false)

const onSubmit = handleSubmit(async (values) => {
  loading.value    = true
  loginError.value = ''

  try {
    const callbackUrl = (route.query.redirect as string) || '/backoffice'

    await signIn(
      { email: values.email, password: values.password },
      { callbackUrl, redirect: true },
    )

    notify('Connexion réussie.', 'success')
  } catch (e: any) {
    console.error('Erreur login brute:', e)
    loginError.value =
      e?.data?.errors?.email?.[0]
      ?? e?.data?.message
      ?? 'Email ou mot de passe incorrect.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>

    <div class="login-head">
      <LayoutsLogo :show-text="false" :size="52" />
      <h1>Espace admin</h1>
      <p>Connecte-toi pour gérer Afro Extension.</p>
    </div>
     <div v-if="loginError" class="fallback-banner">
      <Icon icon="solar:info-circle-line-duotone" width="16" />
          {{ loginError }}
    </div>
    <form @submit.prevent="onSubmit">
      <v-text-field
        v-model="email"
        label="Email"
        type="email"
        variant="outlined"
        flat rounded="xl"
        density="comfortable"
        :error-messages="errEmail"
        autocomplete="email"
        class="mb-3"
      >
        <template #prepend-inner>
          <Icon icon="solar:letter-line-duotone" width="20" />
        </template>
      </v-text-field>

      <v-text-field
        v-model="password"
        label="Mot de passe"
        :type="showPassword ? 'text' : 'password'"
        variant="outlined"
        flat rounded="xl"
        density="comfortable"
        :error-messages="errPassword"
        autocomplete="current-password"
        class="my-4"
      >
        <template #prepend-inner>
          <Icon icon="solar:lock-keyhole-line-duotone" width="18" />
        </template>
        <template #append-inner>
          <button type="button" class="toggle-pw" @click="showPassword = !showPassword">
            <Icon :icon="showPassword ? 'solar:eye-closed-line-duotone' : 'solar:eye-line-duotone'" width="18" />
          </button>
        </template>
      </v-text-field>

 

      <v-btn
        type="submit" block rounded="pill" size="large" color="secondary"
        :loading="loading" class="mt-4"
      >
        Se connecter
        <Icon icon="solar:arrow-right-line-duotone" width="18" style="margin-left: 6px;" />
      </v-btn>
    </form>

  </div>
</template>

<style scoped>
.fallback-banner {
  display: flex; align-items: center; gap: 8px;
  background: rgba(var(--v-theme-error), 0.08); color: rgb(var(--v-theme-error));
  border-radius: var(--r-lg); padding: 10px 14px; font-size: 12px; font-weight: 600;
  margin-bottom: 14px;
}
.login-head { text-align: center; margin-bottom: 28px; }
.login-head :deep(.brand-logo) { justify-content: center; margin-bottom: 14px; }
.login-head h1 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; margin-bottom: 6px; }
.login-head p { font-size: 12.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.toggle-pw { background: none; border: none; cursor: pointer; color: rgb(var(--v-theme-on-surface-variant)); display: flex; }

.error-block {
  display: flex; align-items: center; gap: 8px;
  background: rgba(192, 83, 62, 0.1); color: #C0533E;
  border-radius: var(--r-lg); padding: 12px;
  font-size: 12.5px; font-weight: 600; margin-top: 4px;
}
</style>