<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useAdminSettingsStore } from '~/stores/Models/settings.store'
import type { GeneralFormData } from '~/types/Models/settings.type'

definePageMeta({ layout: 'admin' })

const store = useAdminSettingsStore()

const CURRENCY_OPTIONS = [
  { title: 'Euro (EUR)',       value: 'EUR', symbol: '€' },
  { title: 'Dollar US (USD)',  value: 'USD', symbol: '$' },
  { title: 'Franc CFA (XOF)',  value: 'XOF', symbol: 'FCFA' },
]
const LOCALE_OPTIONS = [
  { title: 'Français',  value: 'fr_FR' },
  { title: 'Anglais',   value: 'en_US' },
  { title: 'Italien',   value: 'it_IT' },
]

const form = reactive<GeneralFormData>({
  name: '',
  currency: 'EUR',
  currencySymbol: '€',
  locale: 'fr_FR',
})

watch(() => store.settings, (s) => {
  if (!s) return
  form.name           = s.name
  form.currency        = s.currency
  form.currencySymbol  = s.currencySymbol
  form.locale           = s.locale
}, { immediate: true })

watch(() => form.currency, (val) => {
  const opt = CURRENCY_OPTIONS.find(o => o.value === val)
  if (opt) form.currencySymbol = opt.symbol
})

// ── Logo boutique
const logoInput = ref<HTMLInputElement | null>(null)
function triggerLogoUpload() {
  logoInput.value?.click()
}
async function onLogoSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    notify('Le fichier doit être une image.', 'error')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    notify('L\'image ne doit pas dépasser 2 Mo.', 'error')
    return
  }

  const success = await store.uploadLogo(file)
  notify(success ? 'Logo mis à jour.' : 'Erreur lors de l\'envoi.', success ? 'success' : 'error')
  if (logoInput.value) logoInput.value.value = ''
}

async function onSubmit() {
  const success = await store.saveGeneral(form)
  notify(success ? 'Réglages généraux enregistrés.' : (store.error ?? 'Une erreur est survenue.'), success ? 'success' : 'error')
}
</script>

<template>
  <div>
    <div v-if="store.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <template v-else>

      <div class="panel">
        <h2>Logo de la boutique</h2>
        <p class="panel-hint">Affiché sur la boutique et dans les documents (factures, emails).</p>

        <div class="logo-row">
          <div class="logo-preview" @click="triggerLogoUpload">
            <img v-if="store.settings?.logoUrl" :src="store.settings.logoUrl" alt="Logo">
            <Icon v-else icon="solar:gallery-line-duotone" width="24" />
            <div v-if="store.saving" class="logo-overlay">
              <v-progress-circular indeterminate color="white" size="20" width="2" />
            </div>
          </div>
          <div>
            <v-btn variant="tonal" color="secondary" rounded="xl" size="small" @click="triggerLogoUpload">
              <Icon icon="solar:cloud-upload-line-duotone" width="15" style="margin-right: 6px;" />
              {{ store.settings?.logoUrl ? 'Changer le logo' : 'Ajouter un logo' }}
            </v-btn>
            <p class="avatar-hint">Carré de préférence, PNG ou JPG, 2 Mo max.</p>
          </div>
          <input ref="logoInput" type="file" accept="image/*" class="hidden-input" @change="onLogoSelect">
        </div>
      </div>

      <div class="panel">
        <h2>Informations générales</h2>
      <p class="panel-hint">Le nom et les préférences régionales de ta boutique.</p>

      <v-text-field
        v-model="form.name" label="Nom de la boutique"
        variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
      >
        <template #prepend-inner><Icon icon="solar:shop-line-duotone" width="18" /></template>
      </v-text-field>

      <div class="field-row">
        <v-select
          v-model="form.currency" :items="CURRENCY_OPTIONS" label="Devise"
          variant="solo-filled" flat rounded="xl" density="comfortable"
        >
          <template #prepend-inner><Icon icon="solar:wallet-money-line-duotone" width="18" /></template>
        </v-select>
        <v-select
          v-model="form.locale" :items="LOCALE_OPTIONS" label="Langue"
          variant="solo-filled" flat rounded="xl" density="comfortable"
        >
          <template #prepend-inner><Icon icon="solar:global-line-duotone" width="18" /></template>
        </v-select>
      </div>

      <div class="panel-foot">
        <v-btn color="secondary" variant="flat" rounded="xl" :loading="store.saving" @click="onSubmit">
          <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
          Enregistrer
        </v-btn>
      </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
.loading-block { display: flex; justify-content: center; padding: 48px 0; }

.panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 20px; margin-bottom: 16px;
}
.panel h2 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; margin-bottom: 4px; }

.logo-row { display: flex; align-items: center; gap: 16px; }
.logo-preview {
  position: relative;
  width: 64px; height: 64px; border-radius: var(--r-lg);
  background: rgb(var(--v-theme-surface-variant));
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer; overflow: hidden; flex-shrink: 0;
}
.logo-preview img { width: 100%; height: 100%; object-fit: cover; }
.logo-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; }
.avatar-hint { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 6px; }
.hidden-input { display: none; }
.panel-hint { font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 18px; }

.field-row { display: grid; grid-template-columns: 1fr; gap: 12px; }

.panel-foot { display: flex; justify-content: flex-end; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }

@media (min-width: 640px) {
  .field-row { grid-template-columns: 1fr 1fr; }
}
</style>