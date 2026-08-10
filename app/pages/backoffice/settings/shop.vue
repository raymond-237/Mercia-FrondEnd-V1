<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useAdminSettingsStore } from '~/stores/Models/settings.store'
import type { ShopFormData } from '~/types/Models/settings.type'

definePageMeta({ layout: 'admin' })

const store = useAdminSettingsStore()

const form = reactive<ShopFormData>({
  email: '', phone: null,
  addressLine1: null, city: null, postalCode: null, country: null,
  instagram: null, facebook: null, tiktok: null, whatsapp: null,
})

watch(() => store.settings, (s) => {
  if (!s) return
  form.email = s.email
  form.phone = s.phone
  Object.assign(form, s.shop)
}, { immediate: true })

async function onSubmit() {
  const success = await store.saveShop(form)
  notify(success ? 'Informations boutique enregistrées.' : (store.error ?? 'Une erreur est survenue.'), success ? 'success' : 'error')
}
</script>

<template>
  <div>
    <div v-if="store.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <template v-else>
      <div class="panel">
        <h2>Contact</h2>
        <p class="panel-hint">Visible sur les factures et les communications clients.</p>

        <div class="field-row">
          <v-text-field v-model="form.email" label="Email de contact" type="email" variant="solo-filled" flat rounded="xl" density="comfortable">
            <template #prepend-inner><Icon icon="solar:letter-line-duotone" width="18" /></template>
          </v-text-field>
          <!-- <v-text-field v-model="form.phone" label="Téléphone" variant="solo-filled" flat rounded="xl" density="comfortable">
            <template #prepend-inner><Icon icon="solar:phone-line-duotone" width="18" /></template>
          </v-text-field> -->

          <UiPhoneInput 
             v-model="form.phone"
              label="Téléphone"
          />
        </div>
      </div>

      <div class="panel">
        <h2>Adresse physique</h2>
        <p class="panel-hint">Optionnelle — utile si tu as un point de retrait.</p>

        <v-text-field v-model="form.addressLine1" label="Adresse" variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3">
          <template #prepend-inner><Icon icon="solar:map-point-line-duotone" width="18" /></template>
        </v-text-field>
        <div class="field-row">
          <v-text-field v-model="form.city" label="Ville" variant="solo-filled" flat rounded="xl" density="comfortable" />
          <v-text-field v-model="form.postalCode" label="Code postal" variant="solo-filled" flat rounded="xl" density="comfortable" />
        </div>
        <!-- <v-text-field v-model="form.country" label="Pays" variant="solo-filled" flat rounded="xl" density="comfortable" class="mt-3">
          <template #prepend-inner><Icon icon="solar:global-line-duotone" width="18" /></template>
        </v-text-field> -->

           <UiCountrySelect
           class="mt-3"
            v-model="form.country"
            label="Pays" 
          />
      </div>

      <div class="panel">
        <h2>Réseaux sociaux</h2>
        <p class="panel-hint">Affichés dans le pied de page de la boutique.</p>

        <div class="field-row">
          <v-text-field v-model="form.instagram" label="Instagram" variant="solo-filled" flat rounded="xl" density="comfortable">
            <template #prepend-inner><Icon icon="solar:camera-line-duotone" width="18" /></template>
          </v-text-field>
          <v-text-field v-model="form.facebook" label="Facebook" variant="solo-filled" flat rounded="xl" density="comfortable">
            <template #prepend-inner><Icon icon="solar:widget-line-duotone" width="18" /></template>
          </v-text-field>
        </div>
        <div class="field-row mt-3">
          <v-text-field v-model="form.tiktok" label="TikTok" variant="solo-filled" flat rounded="xl" density="comfortable">
            <template #prepend-inner><Icon icon="solar:music-note-line-duotone" width="18" /></template>
          </v-text-field>
          <v-text-field v-model="form.whatsapp" label="WhatsApp" variant="solo-filled" flat rounded="xl" density="comfortable">
            <template #prepend-inner><Icon icon="solar:chat-round-line-duotone" width="18" /></template>
          </v-text-field>
        </div>
      </div>

      <div class="panel-foot standalone">
        <v-btn color="secondary" variant="flat" rounded="xl" :loading="store.saving" @click="onSubmit">
          <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
          Enregistrer
        </v-btn>
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
.panel h2 { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.panel-hint { font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 16px; }

.field-row { display: grid; grid-template-columns: 1fr; gap: 12px; }

.panel-foot.standalone { display: flex; justify-content: flex-end; }

@media (min-width: 640px) {
  .field-row { grid-template-columns: 1fr 1fr; }
}
</style>