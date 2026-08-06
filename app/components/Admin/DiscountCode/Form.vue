<script setup lang="ts">
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { useAdminDiscountCodesStore } from '~/stores/Models/discountCodes.store'
import { useCategoriesStore } from '~/stores/Models/category.store'
import { useProductsStore } from '~/stores/Models/products.store'
import type { DiscountCodeFormData, DiscountType, DiscountAppliesTo } from '~/types/Models/discountCode.type'

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
  initialData?: Partial<DiscountCodeFormData>
  saving?: boolean
}>(), {
  saving: false,
})

const emit = defineEmits<{ submit: [DiscountCodeFormData] }>()

const store            = useAdminDiscountCodesStore()
const categoriesStore  = useCategoriesStore()
const productsStore    = useProductsStore()

const schema = yup.object({
  code:  yup.string().required('Le code est requis').matches(/^[A-Z0-9_-]+$/i, 'Lettres, chiffres, tirets uniquement'),
  value: yup.number().typeError('La valeur doit être un nombre').positive('La valeur doit être positive').required('La valeur est requise'),
})

const { validate } = useForm({
  validationSchema: schema,
  initialValues: {
    code: props.initialData?.code ?? '',
    value: props.initialData?.value ?? null,
  },
})

const { value: vCode,  errorMessage: errCode  } = useField<string>('code')
const { value: vValue, errorMessage: errValue } = useField<number | null>('value')

const form = reactive<DiscountCodeFormData>({
  code: props.initialData?.code ?? '',
  discountType: props.initialData?.discountType ?? 'percentage',
  value: props.initialData?.value ?? null,
  appliesTo: props.initialData?.appliesTo ?? 'order',
  appliesToId: props.initialData?.appliesToId ?? null,
  minOrderAmount: props.initialData?.minOrderAmount ?? null,
  maxUses: props.initialData?.maxUses ?? null,
  isActive: props.initialData?.isActive ?? true,
  startsAt: props.initialData?.startsAt ?? null,
  expiresAt: props.initialData?.expiresAt ?? null,
})

watch(vCode, v => { form.code = v.toUpperCase() })
watch(vValue, v => { form.value = v })

const generating = ref(false)
async function onGenerateCode() {
  generating.value = true
  try {
    const code = await store.generateCode()
    if (code) {
      vCode.value = code
      form.code = code
    }
  } catch (e) {
    console.error('Erreur génération code:', e)
  } finally {
    generating.value = false
  }
}

// Icônes reprises telles quelles depuis ProductForm.vue (déjà confirmées
// fonctionnelles dans le projet) — évite de deviner un nom d'icône "percent"
// non vérifié sur le pack Solar.
const TYPE_OPTIONS: { value: DiscountType; label: string; icon: string }[] = [
  { value: 'percentage', label: 'Pourcentage', icon: 'solar:widget-2-line-duotone' },
  { value: 'fixed',      label: 'Montant fixe', icon: 'solar:tag-price-line-duotone' },
]

const SCOPE_OPTIONS: { value: DiscountAppliesTo; label: string; icon: string; hint: string }[] = [
  { value: 'order',    label: 'Commande entière', icon: 'solar:bag-4-line-duotone',   hint: 'S\'applique sur le total du panier' },
  { value: 'category', label: 'Catégorie',        icon: 'solar:folder-line-duotone',  hint: 'S\'applique aux articles d\'une catégorie' },
  { value: 'product',  label: 'Produit précis',    icon: 'solar:box-line-duotone',     hint: 'S\'applique à un seul produit' },
]

// ── Sélecteur catégorie — liste chargée une fois, comme sur les filtres produits
const categoryOptions = computed(() =>
  categoriesStore.categories.map(c => ({ title: c.name, value: c.id })),
)

// ── Sélecteur produit — recherche live avec debounce, la liste complète
// n'est jamais chargée d'un coup (peut être longue)
const productSearch    = ref('')
const productOptions   = ref<{ title: string; value: string }[]>([])
const productLoading   = ref(false)
let productSearchTimer: ReturnType<typeof setTimeout> | null = null

async function searchProducts(query: string) {
  productLoading.value = true
  try {
    const data = await productsStore.fetchProducts({ search: query || undefined, sort: 'name' })
    productOptions.value = data.map(p => ({ title: p.name, value: p.id }))
  } catch (e) {
    console.error('Erreur recherche produits:', e)
  } finally {
    productLoading.value = false
  }
}

watch(productSearch, (query) => {
  if (productSearchTimer) clearTimeout(productSearchTimer)
  productSearchTimer = setTimeout(() => searchProducts(query), 350)
})

onMounted(() => {
  if (!categoriesStore.categories.length) categoriesStore.fetchCategories()
  if (form.appliesTo === 'product') searchProducts('')
})

watch(() => form.appliesTo, (val) => {
  if (val === 'product' && !productOptions.value.length) searchProducts('')
})

// ── Aperçu en temps réel — simule sur un panier fictif de 100€
const previewSubtotal = 100
const previewAmount = computed(() => {
  if (!form.value) return 0
  const raw = form.discountType === 'percentage'
    ? previewSubtotal * (form.value / 100)
    : Math.min(form.value, previewSubtotal)
  return Math.round(raw * 100) / 100
})
const previewBlocked = computed(() =>
  !!form.minOrderAmount && previewSubtotal < form.minOrderAmount,
)

function toDateInputValue(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}
function fromDateInputValue(value: string): string | null {
  return value ? new Date(value).toISOString() : null
}

async function onSubmit() {
  const { valid } = await validate()
  if (!valid) return
  emit('submit', { ...form })
}
</script>

<template>
  <div>

    <div class="form-panel">
      <h2>Informations du code</h2>

      <div class="code-field-row">
        <v-text-field
          v-model="vCode" label="Code" :error-messages="errCode"
          variant="solo-filled" flat rounded="xl" density="comfortable"
          class="code-input" style="text-transform: uppercase;"
        >
          <template #prepend-inner><Icon icon="solar:ticket-sale-line-duotone" width="18" /></template>
        </v-text-field>
        <v-btn variant="tonal" color="secondary" rounded="xl" size="large" :loading="generating" @click="onGenerateCode">
          <Icon icon="solar:magic-stick-3-line-duotone" width="18" style="margin-right: 6px;" />
          <span class="hide-mobile-text">Générer</span>
        </v-btn>
      </div>

      <label class="field-label">Type de remise</label>
      <div class="option-toggle mb-4">
        <button
          v-for="opt in TYPE_OPTIONS" :key="opt.value"
          class="option-card" :class="{ active: form.discountType === opt.value }"
          @click="form.discountType = opt.value"
        >
          <Icon :icon="opt.icon" width="20" />
          {{ opt.label }}
        </button>
      </div>

      <v-text-field
        v-model.number="vValue" label="Valeur de la remise" :error-messages="errValue"
        type="number" :suffix="form.discountType === 'percentage' ? '%' : '€'"
        variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-4"
      >
        <template #prepend-inner><Icon icon="solar:wallet-money-line-duotone" width="18" /></template>
      </v-text-field>

      <label class="field-label">S'applique à</label>
      <div class="option-toggle mb-4">
        <button
          v-for="opt in SCOPE_OPTIONS" :key="opt.value"
          class="option-card" :class="{ active: form.appliesTo === opt.value }"
          @click="form.appliesTo = opt.value"
        >
          <Icon :icon="opt.icon" width="20" />
          {{ opt.label }}
        </button>
      </div>
      <p class="scope-hint">{{ SCOPE_OPTIONS.find(o => o.value === form.appliesTo)?.hint }}</p>

      <v-select
        v-if="form.appliesTo === 'category'"
        v-model="form.appliesToId"
        :items="categoryOptions"
        :loading="categoriesStore.loading"
        item-title="title" item-value="value"
        label="Catégorie ciblée"
        variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-4"
      >
        <template #prepend-inner><Icon icon="solar:folder-line-duotone" width="18" /></template>
      </v-select>

      <v-autocomplete
        v-if="form.appliesTo === 'product'"
        v-model="form.appliesToId"
        v-model:search="productSearch"
        :items="productOptions"
        :loading="productLoading"
        item-title="title" item-value="value"
        label="Produit ciblé"
        placeholder="Tape pour rechercher un produit..."
        no-filter
        variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-4"
      >
        <template #prepend-inner><Icon icon="solar:box-line-duotone" width="18" /></template>
        <template #no-data>
          <div class="autocomplete-empty">
            {{ productLoading ? 'Recherche...' : 'Aucun produit trouvé.' }}
          </div>
        </template>
      </v-autocomplete>
    </div>

    <div class="form-panel">
      <h2>Conditions d'utilisation</h2>

      <div class="field-row">
        <v-text-field
          v-model.number="form.minOrderAmount" label="Montant minimum (optionnel)" type="number" suffix="€"
          variant="solo-filled" flat rounded="xl" density="comfortable"
        >
          <template #prepend-inner><Icon icon="solar:cart-check-line-duotone" width="18" /></template>
        </v-text-field>
        <v-text-field
          v-model.number="form.maxUses" label="Nombre d'utilisations max (optionnel)" type="number"
          variant="solo-filled" flat rounded="xl" density="comfortable"
        >
          <template #prepend-inner><Icon icon="solar:users-group-rounded-line-duotone" width="18" /></template>
        </v-text-field>
      </div>

      <div class="field-row">
        <v-text-field
          :model-value="toDateInputValue(form.startsAt)"
          label="Date de début (optionnel)" type="date"
          variant="solo-filled" flat rounded="xl" density="comfortable"
          @update:model-value="v => form.startsAt = fromDateInputValue(v)"
        >
          <template #prepend-inner><Icon icon="solar:calendar-line-duotone" width="18" /></template>
        </v-text-field>
        <v-text-field
          :model-value="toDateInputValue(form.expiresAt)"
          label="Date d'expiration (optionnel)" type="date"
          variant="solo-filled" flat rounded="xl" density="comfortable"
          @update:model-value="v => form.expiresAt = fromDateInputValue(v)"
        >
          <template #prepend-inner><Icon icon="solar:calendar-mark-line-duotone" width="18" /></template>
        </v-text-field>
      </div>

      <div class="active-toggle">
        <div>
          <div class="active-title">Code actif</div>
          <div class="active-sub">Un code inactif ne peut pas être utilisé au checkout</div>
        </div>
        <v-switch v-model="form.isActive" density="compact" color="secondary" hide-details inset />
      </div>
    </div>

    <!-- Aperçu en temps réel -->
    <div class="preview-panel">
      <div class="preview-head">
        <Icon icon="solar:eye-line-duotone" width="16" />
        Aperçu — sur un panier de {{ previewSubtotal }}€
      </div>

      <div v-if="!form.value" class="preview-empty">Renseigne une valeur pour voir l'aperçu.</div>

      <template v-else>
        <div class="preview-row"><span>Sous-total</span><span>{{ previewSubtotal.toFixed(2) }}€</span></div>
        <div class="preview-row discount"><span>Code {{ form.code || '...' }}</span><span>-{{ previewAmount.toFixed(2) }}€</span></div>
        <div class="preview-row total"><span>Total</span><span>{{ (previewSubtotal - (previewBlocked ? 0 : previewAmount)).toFixed(2) }}€</span></div>

        <div v-if="previewBlocked" class="preview-warning">
          <Icon icon="solar:danger-triangle-line-duotone" width="14" />
          Non applicable — montant minimum de {{ form.minOrderAmount }}€ non atteint sur cet exemple.
        </div>
      </template>
    </div>

    <div class="form-nav">
      <v-btn color="secondary" variant="flat" rounded="xl" size="large" block :loading="saving" @click="onSubmit">
        <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
        {{ mode === 'create' ? 'Créer le code promo' : 'Enregistrer les modifications' }}
      </v-btn>
    </div>

  </div>
</template>

<style scoped>
.hide-mobile-text { display: none; }

.form-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 20px; margin-bottom: 16px;
}
.form-panel h2 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; margin-bottom: 16px; }

.code-field-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 16px; }
.code-input { flex: 1; }
.code-input :deep(input) { font-family: monospace; font-weight: 700; letter-spacing: 0.05em; }

.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 8px; }
.field-row { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 12px; }

.option-toggle { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.option-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: rgb(var(--v-theme-surface-variant));
  border: 1.5px solid transparent; border-radius: var(--r-lg);
  padding: 12px; cursor: pointer; font-size: 11.5px; font-weight: 700;
  color: rgb(var(--v-theme-on-surface-variant));
  transition: border-color .2s, color .2s;
}
.option-card.active { border-color: rgb(var(--v-theme-secondary)); color: rgb(var(--v-theme-secondary)); }
.scope-hint { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: -8px; margin-bottom: 16px; }
.autocomplete-empty { padding: 10px 16px; font-size: 12.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.active-toggle {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg); padding: 14px;
}
.active-title { font-size: 13px; font-weight: 700; }
.active-sub { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }

.preview-panel {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-xl); padding: 18px; margin-bottom: 20px;
}
.preview-head { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 12px; }
.preview-empty { font-size: 12.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.preview-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; color: rgb(var(--v-theme-on-surface-variant)); }
.preview-row.discount { color: #4C7A4C; font-weight: 700; }
.preview-row.total {
  font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700;
  color: rgb(var(--v-theme-on-surface)); border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  margin-top: 6px; padding-top: 10px;
}

.preview-warning {
  display: flex; align-items: center; gap: 8px;
  background: rgba(217, 164, 65, 0.15); color: #B8862F;
  border-radius: var(--r-lg); padding: 10px 12px; font-size: 11.5px; font-weight: 600;
  margin-top: 12px;
}

.form-nav { padding-bottom: 8px; }

@media (min-width: 640px) {
  .option-toggle { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 960px) {
  .hide-mobile-text { display: inline; }
  .field-row { grid-template-columns: 1fr 1fr; }
  .form-nav { display: flex; justify-content: flex-end; }
  .form-nav .v-btn { width: auto; min-width: 260px; }
}
</style>