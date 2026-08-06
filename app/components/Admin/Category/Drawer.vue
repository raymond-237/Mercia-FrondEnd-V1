<script setup lang="ts">
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { useCategoriesStore } from '~/stores/Models/category.store'
import type { CategoryFormData } from '~/types/Models/category.type'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  initialData?: Partial<CategoryFormData> & { id?: string }
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  submit: [CategoryFormData]
}>()

const categoriesStore = useCategoriesStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const schema = yup.object({
  name: yup.string().required('Le nom est requis'),
})

const { validate, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { name: props.initialData?.name ?? '' },
})

const { value: vName, errorMessage: errName } = useField<string>('name')

const form = reactive<CategoryFormData>({
  name: props.initialData?.name ?? '',
  slug: props.initialData?.slug ?? '',
  description: props.initialData?.description ?? '',
  metaTitle: props.initialData?.metaTitle ?? '',
  metaDescription: props.initialData?.metaDescription ?? '',
  isActive: props.initialData?.isActive ?? true,
  position: props.initialData?.position ?? 0,
  parentId: props.initialData?.parentId ?? null,
})

watch(vName, (v) => { form.name = v })

watch(() => form.name, (val) => {
  if (props.mode === 'edit') return
  form.slug = val
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
})

// Réinitialise le formulaire quand on ouvre le drawer avec de nouvelles données
// (ex: passer de "modifier catégorie A" à "modifier catégorie B" sans fermer/rouvrir)
watch(() => props.initialData, (data) => {
  form.name            = data?.name ?? ''
  form.slug             = data?.slug ?? ''
  form.description      = data?.description ?? ''
  form.metaTitle         = data?.metaTitle ?? ''
  form.metaDescription   = data?.metaDescription ?? ''
  form.isActive           = data?.isActive ?? true
  form.position             = data?.position ?? 0
  form.parentId              = data?.parentId ?? null
  resetForm({ values: { name: data?.name ?? '' } })
})

// ── Catégories disponibles comme parent — exclut la catégorie en cours
// d'édition ET tous ses descendants, sinon on pourrait créer une boucle
// (ex: "Perruques" devient le parent de "Femmes" qui est déjà son parent).
const availableParents = computed(() => {
  const excludedIds = new Set<string>()

  if (props.initialData?.id) {
    const collectDescendants = (id: string) => {
      excludedIds.add(id)
      categoriesStore.categories
        .filter(c => c.parentId === id)
        .forEach(child => collectDescendants(child.id))
    }
    collectDescendants(props.initialData.id)
  }

  return categoriesStore.categories.filter(c => !excludedIds.has(c.id))
})

const parentOptions = computed(() => [
  { title: 'Aucune — catégorie racine', value: null },
  ...availableParents.value.map(c => ({ title: c.name, value: c.id })),
])

// ── Création rapide d'une catégorie parente — pour ne pas obliger à fermer
// ce drawer si le parent voulu n'existe pas encore. Slug généré en local
// (même logique que le nom principal) pour pouvoir retrouver la catégorie
// fraîchement créée sans dépendre de ce que createCategory() retourne
// exactement — plus robuste si categoriesStore change de forme un jour.
const quickCreateOpen = ref(false)
const quickCreateName  = ref('')
const quickCreating    = ref(false)

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function quickCreateParent() {
  const name = quickCreateName.value.trim()
  if (!name) return

  const slug = slugify(name)
  quickCreating.value = true

  try {
    await categoriesStore.createCategory({
      name,
      slug,
      description: '',
      metaTitle: '',
      metaDescription: '',
      isActive: true,
      position: 0,
      parentId: null,
    })

    await categoriesStore.fetchCategories()

    const created = categoriesStore.categories.find(c => c.slug === slug)
    if (created) form.parentId = created.id

    quickCreateName.value = ''
    quickCreateOpen.value = false
  } finally {
    quickCreating.value = false
  }
}

async function onSubmit() {
  const { valid } = await validate()
  if (!valid) return
  emit('submit', { ...form })
}

function onClose() {
  isOpen.value = false
}
</script>

<template>
  <v-navigation-drawer v-model="isOpen" temporary location="right" width="400">
    <div class="drawer">

      <div class="drawer-head">
        <h3>{{ mode === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie' }}</h3>
        <v-btn icon variant="text" color="error"  size="36" @click="onClose">
          <Icon icon="solar:close-circle-line-duotone"
           width="25" />
        </v-btn>
      </div>

      <div class="drawer-body">
        <div class="parent-select-row">
          <v-select
            v-model="form.parentId"
            label="Catégorie parente"
            :items="parentOptions"
            variant="solo-filled" flat rounded="xl" density="comfortable"
          > 
            <template #prepend-inner><Icon icon="solar:folder-tree-line-duotone" width="18" /></template>
          </v-select>
          <button type="button"
            class="quick-add-btn"
            color="secondary"
            variant="plain"
            :title="'Créer une nouvelle catégorie racine'" 
            @click="quickCreateOpen = !quickCreateOpen">
            <Icon icon="solar:add-circle-line-duotone" width="30"    />
          </button>
        </div>

        <v-expand-transition>
          <div v-if="quickCreateOpen" class="quick-create-block">
            <v-text-field
              v-model="quickCreateName"
              label="Nom de la nouvelle catégorie parente"
              variant="solo-filled" flat rounded="xl" density="comfortable" hide-details
              @keyup.enter="quickCreateParent"
            />
            <v-btn
              color="secondary" variant="flat" rounded="xl" size="small"
              :loading="quickCreating" :disabled="!quickCreateName.trim()"
              @click="quickCreateParent"
            >
              Créer
            </v-btn>
          </div>
        </v-expand-transition>

        <v-text-field
          v-model="vName" label="Nom de la catégorie" :error-messages="errName"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:tag-line-duotone" width="18" /></template>
        </v-text-field>

        <v-text-field
          v-model="form.slug" label="Slug"
          :hint="mode === 'edit' ? 'Modifier le slug change l\'URL publique' : undefined"
          persistent-hint
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
          :readonly="mode === 'create'"
        >
          <template #prepend-inner><Icon icon="solar:link-line-duotone" width="18" /></template>
        </v-text-field>

        <v-textarea
          v-model="form.description" label="Description" rows="3"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:document-text-line-duotone" width="18" /></template>
        </v-textarea>

        <v-text-field
          v-model="form.metaTitle" label="Titre SEO" variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:magnifer-line-duotone" width="18" /></template>
        </v-text-field>

        <v-textarea
          v-model="form.metaDescription" label="Description SEO" rows="2"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:document-text-line-duotone" width="18" /></template>
        </v-textarea>

        <div class="toggle-row">
          <div>
            <div class="toggle-label">Catégorie active</div>
            <div class="toggle-sub">Visible sur la boutique si activée</div>
          </div>
          <v-switch v-model="form.isActive" color="secondary" hide-details density="compact" />
        </div>
      </div>

      <div class="drawer-foot mx-auto">
        <v-btn variant="tonal" color="primary" rounded="xl" @click="onClose">
          Annuler
        </v-btn>
        <v-btn color="secondary" variant="flat" rounded="xl" bock :loading="saving" @click="onSubmit">
          <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
          {{ mode === 'create' ? 'Créer' : 'Enregistrer' }}
        </v-btn>
      </div>

    </div>
  </v-navigation-drawer>
</template>

<style scoped>
.drawer { display: flex; flex-direction: column; height: 100%; }

.drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.drawer-head h3 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; }

.drawer-body { flex: 1; overflow-y: auto; padding: 20px; }

.toggle-row {
  display: flex; align-items: center; justify-content: space-between;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg); padding: 14px 16px; margin-top: 6px;
}
.toggle-label { font-size: 13px; font-weight: 700; }
.toggle-sub { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); }

.parent-select-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
}
.parent-select-row .v-select { flex: 1; }

.quick-add-btn {
  width: 44px; height: 44px; flex-shrink: 0; margin-top: 2px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--r-lg);
  background: rgba(var(--v-theme-secondary), 0.1);
  color: rgb(var(--v-theme-secondary));
  border: none; cursor: pointer;
  transition: background .15s;
}
.quick-add-btn:hover { background: rgba(var(--v-theme-secondary), 0.18); }

.quick-create-block {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.quick-create-block .v-text-field { flex: 1; }

.drawer-foot {
  display: flex; gap: 10px; padding: 16px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
</style>