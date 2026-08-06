<script setup lang="ts">
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import type { Supplier, SupplierFormData } from '~/services/Models/suppliers.service'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  initialData?: Supplier
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
  submit: [SupplierFormData]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const schema = yup.object({
  name: yup.string().required('Le nom est requis'),
  email: yup.string().email("L'email n'est pas valide").nullable(),
})

const { validate, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { name: props.initialData?.name ?? '', email: props.initialData?.email ?? '' },
})

const { value: vName, errorMessage: errName } = useField<string>('name')
const { value: vEmail, errorMessage: errEmail } = useField<string>('email')

const form = reactive<SupplierFormData>({
  name: props.initialData?.name ?? '',
  contactName: props.initialData?.contactName ?? null,
  email: props.initialData?.email ?? null,
  phone: props.initialData?.phone ?? null,
  country: props.initialData?.country ?? null,
  notes: props.initialData?.notes ?? null,
  isActive: props.initialData?.isActive ?? true,
})

watch(vName, (v) => { form.name = v })
watch(vEmail, (v) => { form.email = v || null })

watch(() => props.initialData, (data) => {
  form.name        = data?.name ?? ''
  form.contactName = data?.contactName ?? null
  form.email       = data?.email ?? null
  form.phone       = data?.phone ?? null
  form.country     = data?.country ?? null
  form.notes       = data?.notes ?? null
  form.isActive    = data?.isActive ?? true
  resetForm({ values: { name: data?.name ?? '', email: data?.email ?? '' } })
})

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
        <h3>{{ mode === 'create' ? 'Nouveau fournisseur' : 'Modifier le fournisseur' }}</h3>
        <v-btn icon variant="text" size="36" @click="onClose">
          <Icon icon="solar:close-circle-line-duotone" width="20" />
        </v-btn>
      </div>

      <div class="drawer-body">
        <v-text-field
          v-model="vName" label="Nom *" :error-messages="errName"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:shop-line-duotone" width="18" /></template>
        </v-text-field>

        <v-text-field
          v-model="form.contactName" label="Personne de contact"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:user-line-duotone" width="18" /></template>
        </v-text-field>

        <v-text-field
          v-model="vEmail" label="Email" type="email" :error-messages="errEmail"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:letter-line-duotone" width="18" /></template>
        </v-text-field>

        <!-- <v-text-field
          v-model="form.phone" label="Téléphone"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:phone-line-duotone" width="18" /></template>
        </v-text-field> -->
          <UiPhoneInput
            v-model="form.phone"
             label="Téléphone"
             class="mb-3"
          />

        <!-- <v-text-field
          v-model="form.country" label="Pays"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:global-line-duotone" width="18" /></template>
        </v-text-field> -->

        <UiCountrySelect
          v-model="form.country"
          label="Pays"
          class="mb-3"
        />

        <v-textarea
          v-model="form.notes" label="Notes" rows="3"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:document-text-line-duotone" width="18" /></template>
        </v-textarea>

        <div class="toggle-row">
          <div>
            <div class="toggle-label">Fournisseur actif</div>
            <div class="toggle-sub">Sélectionnable dans les fiches produit si activé</div>
          </div>
          <v-switch v-model="form.isActive" color="secondary" hide-details density="compact" />
        </div>
      </div>

      <div class="drawer-foot mx-auto">
        <v-btn variant="tonal" color="primary" rounded="xl" @click="onClose">
          Annuler
        </v-btn>
        <v-btn color="secondary" variant="flat" rounded="xl" :loading="saving" @click="onSubmit">
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

.drawer-foot {
  display: flex; gap: 10px; padding: 16px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
</style>