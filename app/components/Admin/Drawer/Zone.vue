<script setup lang="ts">
import { Icon } from '@iconify/vue'
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import type { ShippingZoneFormData } from '~/types/Models/shipping.type';

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  initialData?: Partial<ShippingZoneFormData> & { id?: string }
  saving?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [boolean]; submit: [ShippingZoneFormData] }>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const schema = yup.object({ name: yup.string().required('Le nom est requis') })
const { validate, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { name: props.initialData?.name ?? '' },
})
const { value: vName, errorMessage: errName } = useField<string>('name')

const form = reactive<ShippingZoneFormData>({
  name: props.initialData?.name ?? '',
  countries: props.initialData?.countries ?? [],
})

watch(vName, (v) => { form.name = v })

const countryInput = ref('')
function addCountry() {
  const code = countryInput.value.trim().toUpperCase()
  if (code.length === 2 && !form.countries.includes(code)) {
    form.countries.push(code)
  }
  countryInput.value = ''
}
function removeCountry(code: string) {
  form.countries = form.countries.filter(c => c !== code)
}

watch(() => props.initialData, (data) => {
  form.name       = data?.name ?? ''
  form.countries  = data?.countries ?? []
  resetForm({ values: { name: data?.name ?? '' } })
})

async function onSubmit() {
  const { valid } = await validate()
  if (!valid || form.countries.length === 0) return
  emit('submit', { ...form })
}
</script>

<template>
  <v-navigation-drawer v-model="isOpen" temporary location="right" width="380">
    <div class="drawer">
      <div class="drawer-head">
        <h3>{{ mode === 'create' ? 'Nouvelle zone' : 'Modifier la zone' }}</h3>
        <v-btn icon variant="text" size="46" color="error" @click="isOpen = false">
          <Icon icon="solar:close-circle-line-duotone" width="29" />
        </v-btn>
      </div>

      <div class="drawer-body">
        <v-text-field
          v-model="vName" label="Nom de la zone" :error-messages="errName"
          placeholder="Ex: Europe de l'Ouest"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-4"
        >
          <template #prepend-inner><Icon icon="solar:global-line-duotone" width="18" /></template>
        </v-text-field>

        <label class="field-label">Pays couverts (code à 2 lettres)</label>
        <div class="country-add">
          <v-text-field
            v-model="countryInput" placeholder="IT, FR, BE..." maxlength="2"
            variant="solo-filled" flat rounded="xl" density="compact" hide-details
            @keyup.enter="addCountry"
          />
          <v-btn variant="tonal" color="primary" rounded="xl" @click="addCountry">Ajouter</v-btn>
        </div>
        <div class="countries-chips">
          <v-chip v-for="c in form.countries" :key="c" closable rounded="xl" @click:close="removeCountry(c)">
            {{ c }}
          </v-chip>
          <p v-if="form.countries.length === 0" class="empty-hint">Ajoute au moins un pays.</p>
        </div>
      </div>

      <div class="drawer-foot mx-auto">
        <v-btn variant="tonal" color="primary" rounded="xl"  @click="isOpen = false">Annuler</v-btn>
        <v-btn color="secondary" variant="flat" rounded="xl"  :loading="saving" @click="onSubmit">
          {{ mode === 'create' ? 'Créer' : 'Enregistrer' }}
        </v-btn>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<style scoped>
.drawer { display: flex; flex-direction: column; height: 100%; }
.drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 20px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06); }
.drawer-head h3 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; }
.drawer-body { flex: 1; overflow-y: auto; padding: 20px; }
.field-label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 8px; }
.country-add { display: flex; gap: 8px; margin-bottom: 12px; }
.countries-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.empty-hint { font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); }
.drawer-foot { display: flex; gap: 10px; padding: 16px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }
</style>