<script setup lang="ts">
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { useProductsStore } from '~/stores/Models/products.store'
import { useSuppliersStore } from '~/stores/Models/supplier.store'
import type { ProductFormData } from '~/types/Models/product.type'
import useMediasService from '~/services/Models/medias.service'

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
  initialData?: Partial<ProductFormData>
  saving?: boolean
}>(), {
  saving: false,
})

const emit = defineEmits<{ submit: [ProductFormData] }>()

const productsStore = useProductsStore()
const suppliersStore = useSuppliersStore()
const mediasService  = useMediasService()

const step = ref(1)
const STEPS = [
  { label: 'Informations', icon: 'solar:document-text-line-duotone' },
  { label: 'Medias',        icon: 'solar:gallery-line-duotone' },
  { label: 'Variantes',     icon: 'solar:widget-2-line-duotone' },
  { label: 'Verification',  icon: 'solar:clipboard-check-line-duotone' },
]

// -- Validation etape 1

const step1Schema = yup.object({
  name:     yup.string().required('Le nom est requis'),
  category: yup.string().required('La categorie est requise').nullable(),
  price:    yup.number().typeError('Le prix doit etre un nombre').positive('Le prix doit etre positif').required('Le prix est requis'),
})

const { validate: validateStep1 } = useForm({
  validationSchema: step1Schema,
  initialValues: {
    name: props.initialData?.name ?? '',
    category: props.initialData?.category ?? null,
    price: props.initialData?.price ?? null,
  },
})

const { value: vName,     errorMessage: errName     } = useField<string>('name')
const { value: vCategory, errorMessage: errCategory } = useField<string | null>('category')
const { value: vPrice,    errorMessage: errPrice    } = useField<number | null>('price')

// -- Form complet

const form = reactive<ProductFormData>({
  name: props.initialData?.name ?? '',
  slug: props.initialData?.slug ?? '',
  category: props.initialData?.category ?? null,
  supplier: props.initialData?.supplier ?? null,
  price: props.initialData?.price ?? null,
  comparePrice: props.initialData?.comparePrice ?? null,
  // Sert de valeur par defaut pour la variante implicite des produits
  // "simples" (sans options) — pour les produits a variantes, c'est le
  // prix de revient PAR VARIANTE (etape 3) qui compte reellement.
  costPrice: props.initialData?.costPrice ?? null,
  sku: props.initialData?.sku ?? '',
  shortDescription: props.initialData?.shortDescription ?? '',
  description: props.initialData?.description ?? '',
  status: props.initialData?.status ?? 'draft',
  seoTitle: props.initialData?.seoTitle ?? '',
  seoDescription: props.initialData?.seoDescription ?? '',
  media: props.initialData?.media ?? [],
  optionTypes: props.initialData?.optionTypes ?? [],
  variants: props.initialData?.variants ?? [],
})

// Variantes marquees pour suppression reelle en base (existaient deja cote API)
const removedVariantIds = ref<string[]>([])
// Cles de combinaisons explicitement retirees par l'utilisateur - la regeneration
// automatique des variantes ne les recree pas tant que les options ne changent pas.
const excludedVariantKeys = ref<Set<string>>(new Set())

watch(vName, (v) => { form.name = v })
watch(vCategory, (v) => { form.category = v })
watch(vPrice, (v) => { form.price = v })

watch(() => form.name, (val) => {
  if (props.mode === 'edit') return
  form.slug = val
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
})

// -- Categories

const FALLBACK_CATEGORY_OPTIONS = [
  { title: 'Lisse',     value: 'lisse' },
  { title: 'Boucle',    value: 'boucle' },
  { title: 'Body Wave', value: 'body-wave' },
  { title: 'Perruques', value: 'perruques' },
  { title: 'Soins',     value: 'soins' },
]
const categoryOptions = ref(FALLBACK_CATEGORY_OPTIONS)

async function loadCategories() {
  try {
    const data = await productsStore.fetchCategories()
    categoryOptions.value = data?.length
      ? data.map(c => ({ title: c.name, value: c.id }))
      : FALLBACK_CATEGORY_OPTIONS
  } catch (e) {
    console.error('Erreur chargement categories (formulaire produit):', e)
    categoryOptions.value = FALLBACK_CATEGORY_OPTIONS
  }
}

// -- Fournisseurs

const supplierOptions = computed(() => [
  { title: 'Aucun fournisseur', value: null },
  ...suppliersStore.suppliers
    .filter(s => s.isActive)
    .map(s => ({ title: s.name, value: s.id })),
])

async function loadSuppliers() {
  try {
    await suppliersStore.fetchSuppliers()
  } catch (e) {
    console.error('Erreur chargement fournisseurs (formulaire produit):', e)
  }
}

onMounted(() => {
  loadCategories()
  loadSuppliers()
})

// -- Step 2 - Medias

async function onFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return

  for (const file of Array.from(files)) {
    const localId  = crypto.randomUUID()
    const localUrl = URL.createObjectURL(file)

    form.media.push({ id: localId, url: localUrl, uploading: true })

    try {
      const uploaded = await mediasService.uploadTemporary(file)
      const item = form.media.find(m => m.id === localId)
      if (item) {
        item.uploading = false
        item.remoteId  = uploaded.id
        item.url       = uploaded.url ?? item.url
      }
    } catch (err) {
      console.error('Erreur upload media:', err)
      const item = form.media.find(m => m.id === localId)
      if (item) { item.uploading = false; item.uploadError = true }
    }
  }
}

function removeMedia(id: string) {
  const item = form.media.find(m => m.id === id)
  form.media = form.media.filter(m => m.id !== id)
  if (item?.remoteId) {
    mediasService.remove(item.remoteId).catch(() => {})
  }
  if (mediaLightbox.value?.id === id) mediaLightboxOpen.value = false
}

function moveMediaLeft(index: number) {
  if (index === 0) return
  const arr = [...form.media]
  ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
  form.media = arr
}
function moveMediaRight(index: number) {
  if (index === form.media.length - 1) return
  const arr = [...form.media]
  ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
  form.media = arr
}
function setPrimary(index: number) {
  if (index === 0) return
  const arr = [...form.media]
  const [item] = arr.splice(index, 1)
  arr.unshift(item)
  form.media = arr
}

// -- Lightbox zoom media
const mediaLightboxOpen  = ref(false)
const mediaLightboxIndex = ref(0)
const mediaLightbox = computed(() => form.media[mediaLightboxIndex.value] ?? null)

function openMediaLightbox(index: number) {
  mediaLightboxIndex.value = index
  mediaLightboxOpen.value  = true
}
function mediaLightboxPrev() {
  mediaLightboxIndex.value = (mediaLightboxIndex.value - 1 + form.media.length) % form.media.length
}
function mediaLightboxNext() {
  mediaLightboxIndex.value = (mediaLightboxIndex.value + 1) % form.media.length
}
function removeCurrentLightboxMedia() {
  if (!mediaLightbox.value) return
  const id = mediaLightbox.value.id
  removeMedia(id)
  if (form.media.length === 0) mediaLightboxOpen.value = false
  else mediaLightboxIndex.value = Math.min(mediaLightboxIndex.value, form.media.length - 1)
}

// -- Step 3 - Options & variantes

const QUICK_OPTION_TYPES = [
  { name: 'Couleur',  icon: 'solar:pallete-2-line-duotone', isColor: true },
  { name: 'Longueur', icon: 'solar:ruler-line-duotone',      isColor: false },
  { name: 'Taille',   icon: 'solar:widget-2-line-duotone',    isColor: false },
  { name: 'Texture',  icon: 'solar:magic-stick-3-line-duotone', isColor: false },
  { name: 'Matiere',  icon: 'solar:layers-line-duotone',      isColor: false },
]

const COLOR_PALETTE = [
  { name: 'Noir naturel', hex: '#1A1210' },
  { name: 'Brun',         hex: '#5C3A21' },
  { name: 'Chatain',      hex: '#8B5A2B' },
  { name: 'Blond',        hex: '#D4A94C' },
  { name: 'Auburn',       hex: '#A0522D' },
  { name: 'Bordeaux',     hex: '#6B2737' },
]

const newOptionValue = ref<Record<string, string>>({})
const newColorHex     = ref<Record<string, string>>({})

function isColorOption(name: string) {
  return /couleur|color/i.test(name)
}

function addQuickOptionType(preset: typeof QUICK_OPTION_TYPES[number]) {
  if (form.optionTypes.some(o => o.name.toLowerCase() === preset.name.toLowerCase())) return
  form.optionTypes.push({ id: crypto.randomUUID(), name: preset.name, values: [] })
}
function addOptionType() {
  form.optionTypes.push({ id: crypto.randomUUID(), name: '', values: [] })
}
function removeOptionType(id: string) {
  form.optionTypes = form.optionTypes.filter(o => o.id !== id)
}
function addOptionValue(optionId: string) {
  const val = newOptionValue.value[optionId]?.trim()
  if (!val) return
  const opt = form.optionTypes.find(o => o.id === optionId)
  opt?.values.push(val)
  newOptionValue.value[optionId] = ''
}
function addColorValue(optionId: string, name: string, hex: string) {
  if (!name.trim()) return
  const opt = form.optionTypes.find(o => o.id === optionId)
  const label = `${name.trim()} (${hex})`
  if (opt && !opt.values.includes(label)) opt.values.push(label)
}
function removeOptionValue(optionId: string, val: string) {
  const opt = form.optionTypes.find(o => o.id === optionId)
  if (opt) opt.values = opt.values.filter(v => v !== val)
}

function extractSwatch(value: string): string | null {
  const match = value.match(/\(#([0-9A-Fa-f]{6})\)/)
  return match ? `#${match[1]}` : null
}

function generateVariants() {
  const activeOptions = form.optionTypes.filter(o => o.values.length > 0)
  if (activeOptions.length === 0) { form.variants = []; return }

  let combos: string[][] = [[]]
  for (const opt of activeOptions) {
    const next: string[][] = []
    for (const combo of combos) {
      for (const val of opt.values) next.push([...combo, val])
    }
    combos = next
  }

  const newVariants = combos
    .map(combo => ({ key: combo.join('-'), label: combo.join(' / '), combo }))
    .filter(({ key }) => !excludedVariantKeys.value.has(key))
    .map(({ key, label, combo }) => {
      // Cherche d'abord par clé technique (variantes déjà régénérées dans
      // cette session), puis par label. Le fallback par label est essentiel
      // en édition : les variantes reconstruites depuis l'API ont une clé
      // = leur UUID réel, qui ne peut jamais matcher une clé recalculée à
      // partir des combinaisons d'options — seul le label est stable entre
      // les deux schémas et permet de préserver le lien .id vers la vraie
      // variante en base (sans quoi elle serait dupliquée à l'enregistrement).
      const existing = form.variants.find(v => v.key === key)
                     ?? form.variants.find(v => v.label === label)

      if (existing) return { ...existing, key, label }

      return {
        key,
        label,
        price: form.price,
        costPrice: form.costPrice,
        stock: 0,
        sku: `${form.sku || 'SKU'}-${combo.map(c => c.replace(/\s*\(.+\)/, '').slice(0, 3).toUpperCase()).join('')}`,
      }
    })

  form.variants = newVariants
}

function removeVariant(variant: any) {
  // Exclut par clé dérivée du label (et non la clé interne actuelle) — c'est
  // ce que generateVariants() recalculera pour cette même variante, donc la
  // seule façon fiable d'empêcher sa recréation automatique au prochain
  // passage sur cette étape, y compris pour une variante reconstruite depuis
  // l'API (dont la clé de départ est un UUID, pas un combo de labels).
  const derivedKey = variant.label.split(' / ').join('-')
  excludedVariantKeys.value.add(derivedKey)
  excludedVariantKeys.value.add(variant.key)

  form.variants = form.variants.filter(v => v.key !== variant.key)
  if (variant.id) removedVariantIds.value.push(variant.id)
}

// -- Etape 4 - Verification finale

const checklist = computed(() => {
  const items: { label: string; ok: boolean; hint?: string }[] = []
  items.push({ label: 'Nom du produit renseigne', ok: !!form.name })
  items.push({ label: 'Categorie selectionnee', ok: !!form.category })
  items.push({ label: 'Prix defini', ok: !!form.price && form.price > 0 })
  items.push({
    label: 'Au moins une photo',
    ok: form.media.length > 0,
    hint: form.media.length === 0 ? 'Un produit sans photo convertit tres mal.' : undefined,
  })
  items.push({
    label: 'Description renseignee',
    ok: (form.description?.length ?? 0) >= 40,
    hint: (form.description?.length ?? 0) < 40 ? 'Recommande pour rassurer les clients.' : undefined,
  })
  if (form.optionTypes.some(o => o.values.length > 0)) {
    items.push({
      label: 'Stock defini pour chaque variante',
      ok: form.variants.every(v => (v.stock ?? 0) >= 0) && form.variants.length > 0,
    })
  }
  items.push({
    label: 'Prix de revient renseigne',
    ok: form.variants.length
      ? form.variants.every(v => v.costPrice != null)
      : form.costPrice != null,
    hint: 'Sans lui, Analytics affichera un bénéfice de 100% pour ce produit — pas fiable.',
  })
  return items
})

// -- Navigation

async function goNext() {
  if (step.value === 1) {
    const { valid } = await validateStep1()
    if (!valid) return
  }
  if (step.value === 2 && form.media.some(m => m.uploading)) return
  if (step.value === 3) generateVariants()
  if (step.value < 4) step.value++
}
function goBack() {
  if (step.value > 1) step.value--
}
function goToStep(n: number) {
  step.value = n
}

async function onSubmit() {
  const { valid } = await validateStep1()
  if (!valid) { step.value = 1; return }
  if (form.media.some(m => m.uploading)) { step.value = 2; return }
  emit('submit', { ...form, removedVariantIds: removedVariantIds.value } as any)
}
</script>

<template>
  <div>

    <div class="stepper">
      <button
        v-for="(s, i) in STEPS" :key="s.label"
        class="step-item" :class="{ active: step === i + 1, done: step > i + 1 }"
        @click="goToStep(i + 1)"
      >
        <div class="step-dot">
          <Icon v-if="step > i + 1" icon="solar:check-circle-line-duotone" width="25" />
          <Icon v-else :icon="s.icon" width="25" />
        </div>
        <span class="step-label">{{ s.label }}</span>
        <div v-if="i < STEPS.length - 1" class="step-connector" :class="{ done: step > i + 1 }" />
      </button>
    </div>

    <div class="step-panel">

      <div v-if="step === 1" class="step-content">
        <h2>Informations generales</h2>

        <v-text-field
          v-model="vName" label="Nom du produit" :error-messages="errName"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:tag-line-duotone" width="18" /></template>
        </v-text-field>

        <v-text-field
          v-model="form.slug" label="Slug"
          :hint="mode === 'edit' ? 'Modifier le slug change l\'URL publique du produit' : undefined"
          persistent-hint
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
          :readonly="mode === 'create'"
        >
          <template #prepend-inner><Icon icon="solar:link-line-duotone" width="18" /></template>
        </v-text-field>

        <div class="field-row">
          <v-select
            v-model="vCategory" :items="categoryOptions" label="Categorie" :error-messages="errCategory"
            variant="solo-filled" flat rounded="xl" density="comfortable"
          >
            <template #prepend-inner><Icon icon="solar:folder-line-duotone" width="18" /></template>
          </v-select>
          <v-text-field v-model="form.sku" label="SKU" variant="solo-filled" flat rounded="xl" density="comfortable">
            <template #prepend-inner><Icon icon="solar:barcode-line-duotone" width="18" /></template>
          </v-text-field>
        </div>

        <v-select
          v-model="form.supplier" :items="supplierOptions" label="Fournisseur"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:box-line-duotone" width="18" /></template>
        </v-select>

        <div class="field-row">
          <v-text-field
            v-model.number="vPrice" label="Prix" type="number" suffix="EUR" :error-messages="errPrice"
            variant="solo-filled" flat rounded="xl" density="comfortable"
          >
            <template #prepend-inner><Icon icon="solar:wallet-money-line-duotone" width="18" /></template>
          </v-text-field>
          <v-text-field v-model.number="form.comparePrice" label="Prix barre (optionnel)" type="number" suffix="EUR" variant="solo-filled" flat rounded="xl" density="comfortable">
            <template #prepend-inner><Icon icon="solar:tag-price-line-duotone" width="18" /></template>
          </v-text-field>
        </div>

        <v-text-field
          v-model.number="form.costPrice" label="Prix de revient" type="number" suffix="EUR"
          hint="Utilisé pour le bénéfice dans Analytics — sert de valeur par défaut si ce produit n'a pas de variantes."
          persistent-hint
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:tag-horizontal-line-duotone" width="18" /></template>
        </v-text-field>

        <v-text-field v-model="form.shortDescription" label="Description courte" variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3">
          <template #prepend-inner><Icon icon="solar:chat-line-line-duotone" width="18" /></template>
        </v-text-field>

        <v-textarea v-model="form.description" label="Description complete" rows="5" variant="solo-filled" flat rounded="xl" density="comfortable">
          <template #prepend-inner><Icon icon="solar:document-text-line-duotone" width="18" /></template>
        </v-textarea>
      </div>

      <div v-else-if="step === 2" class="step-content">
        <h2>Photos du produit</h2>
        <p class="step-hint">La premiere image est la photo principale. Clique sur une photo pour la voir en grand - tu peux la supprimer directement depuis cette vue.</p>

        <label class="upload-zone">
          <input type="file" accept="image/*" multiple class="upload-input" @change="onFileSelect">
          <Icon icon="solar:cloud-upload-line-duotone" width="32" />
          <span>Glisse tes images ici ou clique pour parcourir</span>
        </label>

        <div v-if="form.media.length" class="media-grid">
          <div v-for="(media, i) in form.media" :key="media.id" class="media-item">
            <button class="media-view" @click="openMediaLightbox(i)">
              <img :src="media.url" alt="">
              <span class="media-zoom-hint"><Icon icon="solar:magnifer-zoom-in-line-duotone" width="16" /></span>
            </button>

            <span v-if="i === 0 && !media.uploading" class="media-primary">
              <Icon icon="solar:star-bold" width="10" style="margin-right: 3px;" />
              Principale
            </span>

            <div v-if="media.uploading" class="media-overlay">
              <v-progress-circular indeterminate color="white" size="22" width="2" />
            </div>
            <div v-else-if="media.uploadError" class="media-overlay error">
              <Icon icon="solar:danger-triangle-bold-duotone" width="22" />
            </div>

            <button class="media-remove" @click="removeMedia(media.id)">
              <Icon icon="solar:close-circle-bold-duotone" width="20" />
            </button>

            <div v-if="!media.uploading" class="media-controls">
              <button class="media-ctrl-btn" :disabled="i === 0" @click="moveMediaLeft(i)">
                <Icon icon="solar:alt-arrow-left-line-duotone" width="14" />
              </button>
              <button v-if="i !== 0" class="media-ctrl-btn star" @click="setPrimary(i)">
                <Icon icon="solar:star-line-duotone" width="14" />
              </button>
              <button class="media-ctrl-btn" :disabled="i === form.media.length - 1" @click="moveMediaRight(i)">
                <Icon icon="solar:alt-arrow-right-line-duotone" width="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="step === 3" class="step-content">
        <h2>Options & variantes</h2>
        <p class="step-hint">Ajoute des types d'options - les variantes sont generees automatiquement a partir des combinaisons.</p>

        <div class="quick-options">
          <button
            v-for="preset in QUICK_OPTION_TYPES" :key="preset.name"
            class="quick-option-chip"
            :disabled="form.optionTypes.some(o => o.name.toLowerCase() === preset.name.toLowerCase())"
            @click="addQuickOptionType(preset)"
          >
            <Icon :icon="preset.icon" width="15" />
            {{ preset.name }}
          </button>
          <button class="quick-option-chip custom" @click="addOptionType">
            <Icon icon="solar:add-circle-line-duotone" width="15" />
            Personnalise
          </button>
        </div>

        <div v-for="opt in form.optionTypes" :key="opt.id" class="option-block">
          <div class="option-block-head">
            <v-text-field v-model="opt.name" label="Nom de l'option" variant="solo-filled" flat rounded="xl" density="comfortable" hide-details />
            <v-btn icon variant="text" size="40" @click="removeOptionType(opt.id)">
              <Icon icon="solar:trash-bin-trash-line-duotone" width="18" style="color: #C0533E;" />
            </v-btn>
          </div>

          <div class="option-values">
            <v-chip v-for="val in opt.values" :key="val" closable rounded="xl" @click:close="removeOptionValue(opt.id, val)">
              <span v-if="extractSwatch(val)" class="value-swatch" :style="{ background: extractSwatch(val) }" />
              {{ val }}
            </v-chip>
          </div>

          <template v-if="isColorOption(opt.name)">
            <div class="color-palette">
              <button
                v-for="c in COLOR_PALETTE" :key="c.hex"
                class="palette-swatch" :style="{ background: c.hex }"
                :title="c.name"
                @click="addColorValue(opt.id, c.name, c.hex)"
              />
            </div>
            <div class="option-add">
              <v-text-field
                v-model="newColorHex[opt.id]" placeholder="Nom de la teinte (ex: Chocolat)"
                variant="solo-filled" flat rounded="xl" density="compact" hide-details
              />
              <input
                type="color" class="color-input"
                :value="newColorHex[opt.id + '_hex'] ?? '#1A1210'"
                @input="(e: any) => newColorHex[opt.id + '_hex'] = e.target.value"
              >
              <v-btn
                variant="tonal" color="primary" rounded="xl"
                @click="addColorValue(opt.id, newColorHex[opt.id] ?? '', newColorHex[opt.id + '_hex'] ?? '#1A1210'); newColorHex[opt.id] = ''"
              >
                Ajouter
              </v-btn>
            </div>
          </template>

          <div v-else class="option-add">
            <v-text-field v-model="newOptionValue[opt.id]" placeholder="Ajouter une valeur..." variant="solo-filled" flat rounded="xl" density="compact" hide-details @keyup.enter="addOptionValue(opt.id)" />
            <v-btn variant="tonal" color="primary" rounded="xl" @click="addOptionValue(opt.id)">Ajouter</v-btn>
          </div>
        </div>

        <v-btn variant="text" color="secondary" rounded="xl" @click="generateVariants">
          <Icon icon="solar:refresh-line-duotone" width="16" style="margin-right: 6px;" />
          Generer / actualiser les variantes
        </v-btn>

        <div v-if="form.variants.length" class="variants-table">
          <table>
            <thead><tr><th>Variante</th><th>SKU</th><th>Prix</th><th>Prix de revient</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              <tr v-for="v in form.variants" :key="v.key">
                <td class="variant-label">
                  <span v-if="extractSwatch(v.label)" class="value-swatch" :style="{ background: extractSwatch(v.label) }" />
                  {{ v.label }}
                </td>
                <td><v-text-field v-model="v.sku" variant="solo-filled" flat rounded="xl" density="compact" hide-details /></td>
                <td><v-text-field v-model.number="v.price" type="number" suffix="EUR" variant="solo-filled" flat rounded="xl" density="compact" hide-details /></td>
                <td><v-text-field v-model.number="v.costPrice" type="number" suffix="EUR" variant="solo-filled" flat rounded="xl" density="compact" hide-details /></td>
                <td><v-text-field v-model.number="v.stock" type="number" variant="solo-filled" flat rounded="xl" density="compact" hide-details /></td>
                <td>
                  <v-btn icon variant="text" size="32" @click="removeVariant(v)">
                    <Icon icon="solar:trash-bin-trash-line-duotone" width="15" style="color: #C0533E;" />
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="step-content">
        <h2>Verification finale</h2>
        <p class="step-hint">Dernier coup d'oeil avant publication.</p>

        <div class="publish-toggle">
          <button class="publish-option" :class="{ active: form.status === 'draft' }" @click="form.status = 'draft'">
            <Icon icon="solar:file-line-duotone" width="20" />
            <div><div class="publish-title">Brouillon</div><div class="publish-sub">Invisible sur la boutique</div></div>
          </button>
          <button class="publish-option" :class="{ active: form.status === 'active' }" @click="form.status = 'active'">
            <Icon icon="solar:rocket-line-duotone" width="20" />
            <div><div class="publish-title">Publie</div><div class="publish-sub">Visible immediatement</div></div>
          </button>
        </div>

        <v-text-field v-model="form.seoTitle" label="Titre SEO" variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3 mt-4">
          <template #prepend-inner><Icon icon="solar:magnifer-line-duotone" width="18" /></template>
        </v-text-field>
        <v-textarea v-model="form.seoDescription" label="Description SEO" rows="3" variant="solo-filled" flat rounded="xl" density="comfortable">
          <template #prepend-inner><Icon icon="solar:document-text-line-duotone" width="18" /></template>
        </v-textarea>

        <div class="checklist">
          <div v-for="(item, i) in checklist" :key="i" class="check-row" :class="{ warn: !item.ok && item.hint }">
            <Icon :icon="item.ok ? 'solar:check-circle-bold-duotone' : 'solar:danger-triangle-bold-duotone'" width="17" />
            <div>
              <div class="check-label">{{ item.label }}</div>
              <div v-if="!item.ok && item.hint" class="check-hint">{{ item.hint }}</div>
            </div>
          </div>
        </div>

        <div class="summary-recap">
          <h3>Recapitulatif</h3>

          <div v-if="form.media.length" class="recap-images">
            <img v-for="m in form.media.slice(0, 5)" :key="m.id" :src="m.url" alt="">
            <div v-if="form.media.length > 5" class="recap-more">+{{ form.media.length - 5 }}</div>
          </div>

          <div class="recap-row"><span>Produit</span><strong>{{ form.name || '-' }}</strong></div>
          <div class="recap-row"><span>Categorie</span><strong>{{ categoryOptions.find(c => c.value === form.category)?.title ?? '-' }}</strong></div>
          <div class="recap-row"><span>Fournisseur</span><strong>{{ supplierOptions.find(s => s.value === form.supplier)?.title ?? '-' }}</strong></div>
          <div class="recap-row"><span>Prix</span><strong>{{ form.price ?? '-' }}EUR</strong></div>
          <div class="recap-row"><span>Photos</span><strong>{{ form.media.length }}</strong></div>
          <div class="recap-row"><span>Variantes</span><strong>{{ form.variants.length }}</strong></div>
          <div v-if="form.variants.length" class="recap-row"><span>Stock total</span><strong>{{ form.variants.reduce((s, v) => s + (v.stock ?? 0), 0) }}</strong></div>
        </div>
      </div>

    </div>

    <div class="step-nav">
      <v-btn v-if="step > 1" variant="tonal" color="primary" rounded="xl" size="large" @click="goBack">
        <Icon icon="solar:alt-arrow-left-line-duotone" width="16" style="margin-right: 6px;" />
        Retour
      </v-btn>
      <v-spacer />
      <v-btn v-if="step < 4" color="secondary" variant="flat" rounded="xl" size="large" @click="goNext">
        Continuer
        <Icon icon="solar:arrow-right-line-duotone" width="16" style="margin-left: 6px;" />
      </v-btn>
      <v-btn v-else color="secondary" variant="flat" rounded="xl" size="large" :loading="saving" @click="onSubmit">
        <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
        {{ mode === 'create' ? 'Enregistrer le produit' : 'Enregistrer les modifications' }}
      </v-btn>
    </div>

    <v-dialog v-model="mediaLightboxOpen" fullscreen transition="fade-transition">
      <div v-if="mediaLightbox" class="lightbox">
        <div class="lightbox-header">
          <div class="lightbox-counter">{{ mediaLightboxIndex + 1 }} / {{ form.media.length }}</div>
          <div class="lightbox-actions">
            <v-btn icon variant="text" color="white" size="40" @click="removeCurrentLightboxMedia">
              <Icon icon="solar:trash-bin-trash-bold-duotone" width="20" />
            </v-btn>
            <v-btn icon variant="text" color="white" size="40" @click="mediaLightboxOpen = false">
              <Icon icon="solar:close-circle-line-duotone" width="26" />
            </v-btn>
          </div>
        </div>
        <div class="lightbox-stage">
          <button v-if="form.media.length > 1" class="stage-arrow left" @click="mediaLightboxPrev">
            <Icon icon="solar:alt-arrow-left-line-duotone" width="22" />
          </button>
          <img :src="mediaLightbox.url" class="stage-image" alt="">
          <button v-if="form.media.length > 1" class="stage-arrow right" @click="mediaLightboxNext">
            <Icon icon="solar:alt-arrow-right-line-duotone" width="22" />
          </button>
        </div>
      </div>
    </v-dialog>

  </div>
</template>

<style scoped>
.stepper { display: flex; margin-bottom: 24px; }
.step-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; position: relative; background: none; border: none; cursor: pointer; padding: 0; }
.step-dot {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  display: flex; align-items: center; justify-content: center;
  transition: background .2s, color .2s; z-index: 1;
}
.step-item.active .step-dot { background: rgb(var(--v-theme-secondary)); color: rgb(var(--v-theme-on-primary)); }
.step-item.done .step-dot { background: #4C7A4C; color: #FAFAF8; }
.step-label { font-size: 10.5px; font-weight: 700; color: rgb(var(--v-theme-on-surface-variant)); text-align: center; }
.step-item.active .step-label { color: rgb(var(--v-theme-on-surface)); }
.step-connector { position: absolute; top: 18px; left: 50%; width: 100%; height: 2px; background: rgb(var(--v-theme-outline)); z-index: 0; }
.step-connector.done { background: #4C7A4C; }

.step-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl);
  padding: 24px;
  margin-bottom: 20px;
}
.step-content h2 { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 700; margin-bottom: 6px; }
.step-hint { font-size: 12.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 18px; }

.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }

.upload-zone {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.15);
  border-radius: var(--r-xl); padding: 32px; cursor: pointer;
  color: rgb(var(--v-theme-on-surface-variant)); font-size: 13px; font-weight: 600;
  transition: border-color .2s;
}
.upload-zone:hover { border-color: rgb(var(--v-theme-secondary)); }
.upload-input { display: none; }

.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; margin-top: 16px; }
.media-item { position: relative; aspect-ratio: 1; border-radius: var(--r-lg); overflow: hidden; background: rgb(var(--v-theme-surface-variant)); }
.media-view { display: block; width: 100%; height: 100%; border: none; padding: 0; background: none; cursor: zoom-in; position: relative; }
.media-view img { width: 100%; height: 100%; object-fit: cover; display: block; }
.media-zoom-hint {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0); color: #fff; opacity: 0; transition: opacity .2s, background .2s;
}
.media-view:hover .media-zoom-hint { opacity: 1; background: rgba(0,0,0,0.25); }

.media-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}
.media-overlay.error { background: rgba(192, 83, 62, 0.75); }
.media-primary {
  position: absolute; top: 6px; left: 6px;
  display: flex; align-items: center;
  background: rgba(184, 134, 47, 0.95); color: #fff;
  font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: var(--r-full);
}
.media-remove { position: absolute; top: 4px; right: 4px; background: none; border: none; cursor: pointer; color: #fff; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5)); z-index: 2; }

.media-controls {
  position: absolute; bottom: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 6px;
  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
}
.media-ctrl-btn {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.9); color: #1A1210;
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer;
}
.media-ctrl-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.media-ctrl-btn.star { background: rgba(184, 134, 47, 0.95); color: #fff; }

.quick-options { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.quick-option-chip {
  display: flex; align-items: center; gap: 6px;
  background: rgb(var(--v-theme-surface-variant));
  border: 1.5px solid transparent; border-radius: var(--r-full);
  padding: 7px 14px; font-size: 12px; font-weight: 700;
  cursor: pointer; transition: border-color .2s;
}
.quick-option-chip:hover:not(:disabled) { border-color: rgb(var(--v-theme-secondary)); }
.quick-option-chip:disabled { opacity: 0.4; cursor: not-allowed; }
.quick-option-chip.custom { color: rgb(var(--v-theme-secondary)); }

.option-block { background: rgb(var(--v-theme-surface-variant)); border-radius: var(--r-xl); padding: 16px; margin-bottom: 14px; }
.option-block-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.option-values { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.option-add { display: flex; align-items: center; gap: 8px; }

.value-swatch { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; border: 1px solid rgba(0,0,0,0.15); }

.color-palette { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.palette-swatch {
  width: 30px; height: 30px; border-radius: 50%; border: 2px solid rgba(var(--v-theme-on-surface), 0.1);
  cursor: pointer; transition: transform .15s;
}
.palette-swatch:hover { transform: scale(1.1); }
.color-input { width: 40px; height: 40px; border: none; border-radius: var(--r-md); cursor: pointer; padding: 0; flex-shrink: 0; }

.variants-table { margin-top: 20px; overflow-x: auto; }
.variants-table table { width: 100%; border-collapse: collapse; min-width: 680px; }
.variants-table th { text-align: left; font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: rgb(var(--v-theme-on-surface-variant)); padding: 8px; }
.variants-table td { padding: 6px 8px; }
.variant-label { font-size: 12.5px; font-weight: 600; white-space: nowrap; display: flex; align-items: center; }

.publish-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.publish-option {
  display: flex; align-items: center; gap: 10px;
  background: rgb(var(--v-theme-surface-variant));
  border: 1.5px solid transparent; border-radius: var(--r-xl); padding: 14px;
  cursor: pointer; text-align: left; transition: border-color .2s;
}
.publish-option.active { border-color: rgb(var(--v-theme-secondary)); }
.publish-title { font-size: 13px; font-weight: 700; }
.publish-sub { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); }

.checklist { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
.check-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; color: #4C7A4C; }
.check-row.warn { color: #B8862F; }
.check-label { font-size: 12.5px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.check-hint { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }

.summary-recap { background: rgb(var(--v-theme-surface-variant)); border-radius: var(--r-xl); padding: 16px; margin-top: 20px; }
.summary-recap h3 { font-size: 13px; font-weight: 700; margin-bottom: 10px; }
.recap-images { display: flex; gap: 8px; margin-bottom: 14px; }
.recap-images img { width: 48px; height: 48px; border-radius: var(--r-md); object-fit: cover; }
.recap-more { width: 48px; height: 48px; border-radius: var(--r-md); background: rgba(var(--v-theme-on-surface), 0.08); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
.recap-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 4px 0; color: rgb(var(--v-theme-on-surface-variant)); }
.recap-row strong { color: rgb(var(--v-theme-on-surface)); }

.step-nav { display: flex; align-items: center; }

.lightbox { height: 100%; display: flex; flex-direction: column; background: rgba(10, 8, 6, 0.97); }
.lightbox-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; flex-shrink: 0; }
.lightbox-counter { color: rgba(255,255,255,0.7); font-size: 12px; }
.lightbox-actions { display: flex; gap: 4px; }
.lightbox-stage { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; padding: 0 60px; min-height: 0; }
.stage-image { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: var(--r-lg); }
.stage-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.1); color: #FFF;
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer;
}
.stage-arrow.left { left: 12px; }
.stage-arrow.right { right: 12px; }

@media (min-width: 960px) {
  .field-row { grid-template-columns: 1fr 1fr; }
}
</style>