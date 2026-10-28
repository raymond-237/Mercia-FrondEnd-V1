<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useAdminSettingsStore } from '~/stores/Models/settings.store'
import type { HeroSlide, HeroSlideForm } from '~/types/Models/settings.type'

definePageMeta({ layout: 'admin' })

const store = useAdminSettingsStore()

const MAX_SLIDES = 5

function makeEmptySlide(): HeroSlideForm {
  return {
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceType: 'upload',
    image: null,
    title: '',
    subtitle: '',
    ctaLabel: '',
    ctaTo: '',
    tone: 'secondary',
    isActive: true,
  }
}
const slides = ref<HeroSlideForm[]>([])
const uploadingId = ref<string | null>(null)
const expandedId = ref<string | null>(null)
const fileInputs = ref<Record<string, HTMLInputElement | null>>({})

watch(() => store.settings, (s) => {
  if (!s) return

  slides.value = (s.heroSlides ?? []).map((slide, i) => ({
    ...slide,
    id: `slide-${i}-${Date.now()}`,
    sourceType: 'url',
  }))
}, { immediate: true })

onMounted(() => {
  if (!store.settings) store.fetchSettings()
})

const canAddSlide = computed(() => slides.value.length < MAX_SLIDES)
const activeCount = computed(() => slides.value.filter(s => s.isActive).length)

function addSlide() {
  if (!canAddSlide.value) return
  const slide = makeEmptySlide()
  slides.value.push(slide)
  expandedId.value = slide.id
}

function removeSlide(id: string) {
  slides.value = slides.value.filter(s => s.id !== id)
    // .map((s, i) => ({ ...s, order: i }))
  if (expandedId.value === id) expandedId.value = null
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function moveSlide(index: number, dir: -1 | 1) {
  const target = index + dir
  if (target < 0 || target >= slides.value.length) return
  const arr = [...slides.value]
  ;[arr[index], arr[target]] = [arr[target], arr[index]]
  slides.value = arr
    // .map((s, i) => ({ ...s, order: i }))
}

function triggerFileInput(id: string) {
  fileInputs.value[id]?.click()
}

async function onFileSelected(slide: HeroSlideForm, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    notify({ message: 'Le fichier doit être une image.', color: 'error', timeout: 3000 })
    input.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    notify({ message: "L'image ne doit pas dépasser 5 Mo.", color: 'error', timeout: 3000 })
    input.value = ''
    return
  }

  uploadingId.value = slide.id
  const url = await store.uploadHeroImage(file)
  uploadingId.value = null

  if (url) {
    slide.image = url
  } else {
    notify({ message: "Échec de l'upload de l'image.", color: 'error', timeout: 3000 })
  }
  input.value = ''
}

const invalidSlides = computed(() => slides.value.filter(s => !s.image))

async function onSubmit() {
  if (invalidSlides.value.length > 0) {
    notify({ message: 'Chaque slide doit avoir une image (upload ou URL).', color: 'error', timeout: 4000 })
    return
  }

  // const payload = slides.value.map((s, i) => ({ ...s, order: i }))
  const success = await store.saveHeroSlides(slides.value)

  notify({
    message: success ? 'Carrousel hero enregistré.' : (store.error ?? 'Une erreur est survenue.'),
    color: success ? 'success' : 'error',
    timeout: 3000,
  })
}
</script>

<template>
  <div>
    <div v-if="store.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <template v-else>
      <div class="hero-head">
        <div>
          <h2>Carrousel de la page d'accueil</h2>
          <p class="panel-hint">
            {{ activeCount }} slide(s) actif(s) sur {{ slides.length }} · maximum {{ MAX_SLIDES }}
          </p>
        </div>
        <v-btn
          color="secondary" variant="flat" rounded="xl" size="small"
          :disabled="!canAddSlide" @click="addSlide"
        >
          <Icon icon="solar:add-circle-line-duotone" width="18" style="margin-right: 6px;" />
          Ajouter
        </v-btn>
      </div>

      <v-alert
        v-if="!canAddSlide"
        type="info" variant="tonal" rounded="xl" density="compact" class="mb-4"
      >
        Limite de {{ MAX_SLIDES }} slides atteinte. Supprime-en une pour en ajouter une nouvelle.
      </v-alert>

      <div v-if="slides.length === 0" class="empty-block">
        <Icon icon="solar:gallery-wide-line-duotone" width="36" />
        <p>Aucune slide pour l'instant.</p>
        <v-btn color="secondary" variant="tonal" rounded="xl" size="small" @click="addSlide">
          Ajouter la première slide
        </v-btn>
      </div>

      <div v-else class="slides-list">
        <div
          v-for="(slide, index) in slides" :key="slide.id"
          class="slide-card" :class="{ 'slide-card--inactive': !slide.isActive, 'slide-card--invalid': !slide.image }"
        >
          <!-- Ligne résumé, toujours visible -->
          <div class="slide-summary" @click="toggleExpand(slide.id)">
            <div class="slide-thumb">
              <v-progress-circular v-if="uploadingId === slide.id" indeterminate color="secondary" size="22" />
              <img v-else-if="slide.image" :src="slide.image" alt="" />
              <Icon v-else icon="solar:gallery-add-line-duotone" width="20" />
            </div>

            <div class="slide-summary-info">
              <div class="slide-summary-title">
                {{ slide.title || `Slide ${index + 1}` }}
                <Icon v-if="!slide.image" icon="solar:danger-triangle-line-duotone" width="14" class="warn-icon" />
              </div>
              <div class="slide-summary-sub">{{ slide.isActive ? 'Active' : 'Inactive' }}</div>
            </div>

            <div class="slide-reorder">
              <button type="button" class="reorder-btn" :disabled="index === 0" @click.stop="moveSlide(index, -1)">
                <Icon icon="solar:alt-arrow-up-line-duotone" width="16" />
              </button>
              <button type="button" class="reorder-btn" :disabled="index === slides.length - 1" @click.stop="moveSlide(index, 1)">
                <Icon icon="solar:alt-arrow-down-line-duotone" width="16" />
              </button>
            </div>

            <v-switch
              :model-value="slide.isActive" color="secondary" hide-details density="compact" inset
              @click.stop
              @update:model-value="(v) => slide.isActive = v"
            />

            <Icon
              icon="solar:alt-arrow-down-line-duotone" width="18" class="expand-chevron"
              :class="{ 'expand-chevron--open': expandedId === slide.id }"
            />
          </div>

          <!-- Détails, dépliés à la demande -->
          <v-expand-transition>
            <div v-if="expandedId === slide.id" class="slide-details">

              <div class="image-preview" :class="{ 'image-preview--empty':slide.image }">
                <v-progress-circular v-if="uploadingId === slide.id" indeterminate color="secondary" size="28" />
                <img v-else-if="slide.image" :src="slide.image" alt="" />
                <div v-else class="image-preview-placeholder">
                  <Icon icon="solar:gallery-wide-line-duotone" width="28" />
                  <span>Aucune image</span>
                </div>
              </div>

              <v-btn-toggle
                :model-value="slide.sourceType" mandatory color="secondary" rounded="xl"
                density="comfortable" class="source-toggle mb-3"
                @update:model-value="(v) => slide.sourceType = v"
              >
                <v-btn value="upload" size="small">
                  <Icon icon="solar:upload-line-duotone" width="16" style="margin-right: 6px;" />
                  Upload
                </v-btn>
                <v-btn value="url" size="small">
                  <Icon icon="solar:link-line-duotone" width="16" style="margin-right: 6px;" />
                  URL
                </v-btn>
              </v-btn-toggle>

              <template v-if="slide.sourceType === 'upload'">
                <input
                  :ref="(el) => fileInputs[slide.id] = el as HTMLInputElement"
                  type="file" accept="image/*" class="hidden-input"
                  @change="onFileSelected(slide, $event)"
                >
                <v-btn
                  variant="tonal" color="primary" rounded="xl" block
                  :loading="uploadingId === slide.id" class="mb-3"
                  @click="triggerFileInput(slide.id)"
                >
                  <Icon icon="solar:upload-line-duotone" width="17" style="margin-right: 6px;" />
                  {{ slide.image ? "Remplacer l'image" : 'Choisir une image' }}
                </v-btn>
              </template>

              <v-text-field
                v-else
                v-model="slide.image" label="URL de l'image" placeholder="https://..."
                variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
              >
                <template #prepend-inner><Icon icon="solar:link-line-duotone" width="18" /></template>
              </v-text-field>

              <v-text-field
                v-model="slide.title" label="Titre (optionnel)"
                variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
              >
                <template #prepend-inner><Icon icon="solar:text-bold-line-duotone" width="18" /></template>
              </v-text-field>

              <v-text-field
                v-model="slide.subtitle" label="Sous-titre (optionnel)"
                variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
              >
                <template #prepend-inner><Icon icon="solar:text-line-duotone" width="18" /></template>
              </v-text-field>

              <div class="field-row">
                  <v-text-field
                    v-model="slide.ctaLabel"
                    label="Texte du bouton (optionnel)"
                    hint="Laisse vide avec le lien pour masquer le bouton"
                    persistent-hint
                    variant="solo-filled"
                    flat
                    rounded="xl"
                    density="comfortable"
                  >
                  <template #prepend-inner><Icon icon="solar:cursor-line-duotone" width="18" /></template>
                </v-text-field>
                <v-text-field
                  v-model="slide.ctaTo" label="Lien du bouton (optionnel)"
                  variant="solo-filled" flat rounded="xl" density="comfortable"
                >
                  <template #prepend-inner><Icon icon="solar:link-round-line-duotone" width="18" /></template>
                </v-text-field>
              </div>

              <div class="slide-actions">
                <v-btn variant="text" color="error" rounded="xl" size="small" @click="removeSlide(slide.id)">
                  <Icon icon="solar:trash-bin-trash-line-duotone" width="16" style="margin-right: 6px;" />
                  Supprimer cette slide
                </v-btn>
              </div>

            </div>
          </v-expand-transition>
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
.loading-block, .empty-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 0;
  color: rgb(var(--v-theme-on-surface-variant));
  text-align: center;
}

.hero-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.hero-head h2 {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 2px;
}
.panel-hint {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.5;
}

.slides-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }

.slide-card {
  background: rgb(var(--v-theme-surface));
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl);
  overflow: hidden;
  transition: border-color .2s, opacity .2s;
}
.slide-card--inactive { opacity: 0.55; }
.slide-card--invalid { border-color: rgba(var(--v-theme-warning), 0.5); }

.slide-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
}

.slide-thumb {
  width: 44px;
  height: 44px;
  border-radius: var(--r-md);
  background: rgb(var(--v-theme-surface-variant));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  color: rgb(var(--v-theme-on-surface-variant));
}
.slide-thumb img { width: 100%; height: 100%; object-fit: cover; }

.slide-summary-info { flex: 1; min-width: 0; }
.slide-summary-title {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.slide-summary-sub { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); }
.warn-icon { color: rgb(var(--v-theme-warning)); flex-shrink: 0; }

.slide-reorder { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
.reorder-btn {
  width: 22px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
}
.reorder-btn:disabled { opacity: 0.25; cursor: default; }
.reorder-btn:hover:not(:disabled) { color: rgb(var(--v-theme-secondary)); }

.expand-chevron { flex-shrink: 0; transition: transform .2s; color: rgb(var(--v-theme-on-surface-variant)); }
.expand-chevron--open { transform: rotate(180deg); }

.slide-details {
  padding: 4px 14px 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  padding-top: 14px;
}

.image-preview {
  width: 100%;
  aspect-ratio: 16 / 7;
  border-radius: var(--r-lg);
  background: rgb(var(--v-theme-surface-variant));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 12px;
}
.image-preview img { width: 100%; height: 100%; object-fit: cover; }
.image-preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 11px;
}

.source-toggle { width: 100%; }
.source-toggle :deep(.v-btn) { flex: 1; }

.hidden-input { display: none; }

.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 4px; }

.slide-actions { display: flex; justify-content: flex-end; margin-top: 4px; }

.panel-foot.standalone {
  display: flex;
  justify-content: flex-end;
}

@media (min-width: 600px) {
  .field-row { grid-template-columns: 1fr 1fr; }
}
</style>