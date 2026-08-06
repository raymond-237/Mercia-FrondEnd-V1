<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useAdminProfileStore } from '~/stores/Models/profile.store'
import type { ProfileFormData } from '~/types/Models/security-management/profile.type'

definePageMeta({ layout: 'admin' })

const store = useAdminProfileStore()

onMounted(() => {
  if (!store.profile) store.fetchProfile()
})

const LOCALE_OPTIONS = [
  { title: 'Français',  value: 'fr_FR' },
  { title: 'Anglais',   value: 'en_US' },
  { title: 'Italien',   value: 'it_IT' },
]
const THEME_OPTIONS = [
  { value: 'light', label: 'Clair',      icon: 'solar:sun-2-line-duotone' },
  { value: 'dark',  label: 'Sombre',     icon: 'solar:moon-stars-line-duotone' },
  { value: 'auto',  label: 'Automatique', icon: 'solar:monitor-line-duotone' },
]

const form = reactive<ProfileFormData>({
  firstName: '', lastName: '', phone: null,
  locale: 'fr_FR', theme: 'auto',
})

watch(() => store.profile, (p) => {
  if (!p) return
  form.firstName = p.firstName
  form.lastName  = p.lastName
  form.phone     = p.phone
  form.locale    = p.locale
  form.theme     = p.theme
}, { immediate: true })

async function onSubmit() {
  const success = await store.updateProfile(form)
  notify(success ? 'Profil mis à jour.' : (store.error ?? 'Une erreur est survenue.'), success ? 'success' : 'error')
}

// ── Avatar
const fileInput = ref<HTMLInputElement | null>(null)
function triggerUpload() {
  fileInput.value?.click()
}
async function onAvatarSelect(e: Event) {
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

  const success = await store.uploadAvatar(file)
  notify(success ? 'Photo de profil mise à jour.' : 'Erreur lors de l\'envoi.', success ? 'success' : 'error')
  if (fileInput.value) fileInput.value.value = ''
}

function initials() {
  return `${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`.toUpperCase()
}
</script>

<template>
  <div>
    <div v-if="store.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <template v-else>

      <div class="panel">
        <h2>Photo de profil</h2>
        <p class="panel-hint">Visible dans le backoffice, pour toi et ton équipe.</p>

        <div class="avatar-row">
          <div class="avatar-preview" @click="triggerUpload">
            <img v-if="store.profile?.avatarUrl" :src="store.profile.avatarUrl" alt="Avatar">
            <span v-else class="avatar-initials">{{ initials() || '?' }}</span>
            <div v-if="store.uploadingAvatar" class="avatar-overlay">
              <v-progress-circular indeterminate color="white" size="24" width="2" />
            </div>
          </div>
          <div class="avatar-actions">
            <v-btn variant="tonal" color="secondary" rounded="xl" size="small" @click="triggerUpload">
              <Icon icon="solar:camera-line-duotone" width="15" style="margin-right: 6px;" />
              Changer la photo
            </v-btn>
            <p class="avatar-hint">JPG ou PNG, 2 Mo max.</p>
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="hidden-input" @change="onAvatarSelect">
        </div>
      </div>

      <div class="panel">
        <h2>Informations personnelles</h2>

        <div class="field-row">
          <v-text-field v-model="form.firstName" label="Prénom" variant="solo-filled" flat rounded="xl" density="comfortable">
            <template #prepend-inner><Icon icon="solar:user-line-duotone" width="18" /></template>
          </v-text-field>
          <v-text-field v-model="form.lastName" label="Nom" variant="solo-filled" flat rounded="xl" density="comfortable" />
        </div>

        <div class="field-row mt-3">
          <v-text-field :model-value="store.profile?.email" label="Email" readonly variant="solo-filled" flat rounded="xl" density="comfortable" hint="Contacte le support pour changer ton email" persistent-hint>
            <template #prepend-inner><Icon icon="solar:letter-line-duotone" width="18" /></template>
          </v-text-field>
          <v-text-field v-model="form.phone" label="Téléphone" variant="solo-filled" flat rounded="xl" density="comfortable">
            <template #prepend-inner><Icon icon="solar:phone-line-duotone" width="18" /></template>
          </v-text-field>
        </div>
      </div>

      <div class="panel">
        <h2>Préférences d'interface</h2>
        <p class="panel-hint">Personnelles à ton compte — n'affectent pas ce que voient tes clients sur la boutique.</p>

        <label class="field-label">Langue du backoffice</label>
        <v-select
          v-model="form.locale" :items="LOCALE_OPTIONS" variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-4"
        >
          <template #prepend-inner><Icon icon="solar:global-line-duotone" width="18" /></template>
        </v-select>

        <label class="field-label">Thème</label>
        <div class="theme-toggle">
          <button
            v-for="opt in THEME_OPTIONS" :key="opt.value"
            class="theme-option" :class="{ active: form.theme === opt.value }"
            @click="form.theme = opt.value"
          >
            <Icon :icon="opt.icon" width="20" />
            {{ opt.label }}
          </button>
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
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 8px; }

.avatar-row { display: flex; align-items: center; gap: 16px; }
.avatar-preview {
  position: relative;
  width: 68px; height: 68px; border-radius: 50%;
  background: rgb(var(--v-theme-secondary));
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; overflow: hidden; flex-shrink: 0;
}
.avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
.avatar-initials { color: #FAFAF8; font-size: 22px; font-weight: 700; font-family: 'Fraunces', serif; }
.avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; }
.avatar-actions { flex: 1; }
.avatar-hint { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 6px; }
.hidden-input { display: none; }

.theme-toggle { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.theme-option {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: rgb(var(--v-theme-surface-variant));
  border: 1.5px solid transparent; border-radius: var(--r-lg);
  padding: 14px 8px; cursor: pointer; font-size: 11.5px; font-weight: 700;
  color: rgb(var(--v-theme-on-surface-variant));
  transition: border-color .2s, color .2s;
}
.theme-option.active { border-color: rgb(var(--v-theme-secondary)); color: rgb(var(--v-theme-secondary)); }

.panel-foot.standalone { display: flex; justify-content: flex-end; }

@media (min-width: 640px) {
  .field-row { grid-template-columns: 1fr 1fr; }
}
</style>