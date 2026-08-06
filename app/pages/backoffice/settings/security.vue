<script setup lang="ts">
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { notify } from '~/@cores/constantes/helpers'
import { useAdminSettingsStore } from '~/stores/Models/settings.store'

definePageMeta({ layout: 'admin' })

const store = useAdminSettingsStore()

const schema = yup.object({
  currentPassword: yup.string().required('Le mot de passe actuel est requis'),
  newPassword: yup.string().min(8, 'Au moins 8 caractères').required('Le nouveau mot de passe est requis'),
  newPassword_confirmation: yup.string().oneOf([yup.ref('newPassword')], 'Les mots de passe ne correspondent pas').required('Confirme le nouveau mot de passe'),
})

const { validate, resetForm } = useForm({ validationSchema: schema })
const { value: vCurrent, errorMessage: errCurrent } = useField<string>('currentPassword')
const { value: vNew,      errorMessage: errNew      } = useField<string>('newPassword')
const { value: vConfirm,  errorMessage: errConfirm  } = useField<string>('newPassword_confirmation')

async function onChangePassword() {
  const { valid } = await validate()
  if (!valid) return

  const success = await store.changePassword({
    currentPassword: vCurrent.value,
    newPassword: vNew.value,
    newPassword_confirmation: vConfirm.value,
  })

  if (success) {
    notify('Mot de passe modifié avec succès.', 'success')
    resetForm()
  } else {
    notify(store.error ?? 'Une erreur est survenue.', 'error')
  }
}

// ── 2FA — simple interrupteur booléen pour l'instant. Pas de véritable
// mise en place TOTP (génération de secret, QR code, vérification du
// premier code) — à construire séparément si besoin d'un vrai 2FA.
const is2faEnabled = ref(false)
const toggling      = ref(false)

watch(() => store.settings, (s) => {
  // is2faEnabled vit sur User, pas sur Tenant — à connecter à ton state
  // utilisateur courant si tu en as un store dédié.
}, { immediate: true })

async function onToggle2fa() {
  toggling.value = true
  const result = await store.toggle2fa()
  toggling.value = false
  if (result !== null) {
    is2faEnabled.value = result
    notify(result ? 'Authentification à deux facteurs activée.' : 'Authentification à deux facteurs désactivée.', 'success')
  } else {
    notify('Une erreur est survenue.', 'error')
  }
}
</script>

<template>
  <div>

    <div class="panel">
      <h2>Changer le mot de passe</h2>
      <p class="panel-hint">Tu seras déconnecté de tes autres sessions actives après ce changement.</p>

      <v-text-field
        v-model="vCurrent" label="Mot de passe actuel" type="password" :error-messages="errCurrent"
        variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
      >
        <template #prepend-inner><Icon icon="solar:lock-line-duotone" width="18" /></template>
      </v-text-field>

      <div class="field-row">
        <v-text-field
          v-model="vNew" label="Nouveau mot de passe" type="password" :error-messages="errNew"
          variant="solo-filled" flat rounded="xl" density="comfortable"
        >
          <template #prepend-inner><Icon icon="solar:key-line-duotone" width="18" /></template>
        </v-text-field>
        <v-text-field
          v-model="vConfirm" label="Confirmer" type="password" :error-messages="errConfirm"
          variant="solo-filled" flat rounded="xl" density="comfortable"
        >
          <template #prepend-inner><Icon icon="solar:key-line-duotone" width="18" /></template>
        </v-text-field>
      </div>

      <div class="panel-foot">
        <v-btn color="secondary" variant="flat" rounded="xl" :loading="store.saving" @click="onChangePassword">
          <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
          Modifier le mot de passe
        </v-btn>
      </div>
    </div>

    <div class="panel">
      <div class="twofa-row">
        <div class="twofa-info">
          <h2>Authentification à deux facteurs</h2>
          <p class="panel-hint" style="margin-bottom: 0;">Sécurise ton compte avec une étape de vérification supplémentaire.</p>
        </div>
        <v-switch :model-value="is2faEnabled" :loading="toggling" density="compact" color="secondary" hide-details inset @click="onToggle2fa" />
      </div>
    </div>

  </div>
</template>

<style scoped>
.panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 20px; margin-bottom: 16px;
}
.panel h2 { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.panel-hint { font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 16px; }

.field-row { display: grid; grid-template-columns: 1fr; gap: 12px; }
.panel-foot { display: flex; justify-content: flex-end; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }

.twofa-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.twofa-info { flex: 1; }

@media (min-width: 640px) {
  .field-row { grid-template-columns: 1fr 1fr; }
}
</style>