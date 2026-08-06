<script setup lang="ts">
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import type { TaxRateFormData } from '~/services/Models/taxrate.service';

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
  initialData?: Partial<TaxRateFormData>
  saving?: boolean
}>(), {
  saving: false,
})

const emit = defineEmits<{ submit: [TaxRateFormData] }>()

const schema = yup.object({
  name: yup.string().required('Le nom est requis'),
  rate: yup.number().typeError('Le taux doit être un nombre').min(0, 'Le taux ne peut pas être négatif').max(100, 'Le taux ne peut pas dépasser 100%').required('Le taux est requis'),
})

const { validate } = useForm({
  validationSchema: schema,
  initialValues: {
    name: props.initialData?.name ?? '',
    rate: props.initialData?.rate ?? null,
  },
})

const { value: vName, errorMessage: errName } = useField<string>('name')
const { value: vRate, errorMessage: errRate } = useField<number | null>('rate')

const form = reactive<TaxRateFormData>({
  name: props.initialData?.name ?? '',
  rate: props.initialData?.rate ?? null,
  countryCode: props.initialData?.countryCode ?? null,
  isDefault: props.initialData?.isDefault ?? false,
  isActive: props.initialData?.isActive ?? true,
})

watch(vName, v => { form.name = v })
watch(vRate, v => { form.rate = v })

async function onSubmit() {
  const { valid } = await validate()
  if (!valid) return
  emit('submit', { ...form })
}
</script>

<template>
  <div>

    <div class="form-panel">
      <h2>Informations du taux</h2>

      <v-text-field
        v-model="vName" label="Nom (ex: TVA France)" :error-messages="errName"
        variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
      >
        <template #prepend-inner><Icon icon="solar:document-text-line-duotone" width="18" /></template>
      </v-text-field>

      <div class="field-row">
        <v-text-field
          v-model.number="vRate" label="Taux" :error-messages="errRate"
          type="number" suffix="%"
          variant="solo-filled" flat rounded="xl" density="comfortable"
        >
          <template #prepend-inner><Icon icon="solar:calculator-line-duotone" width="18" /></template>
        </v-text-field>

        <v-text-field
          v-model="form.countryCode" label="Code pays (optionnel)"
          placeholder="FR, BE, IT..." maxlength="2"
          hint="Laisse vide pour appliquer à tous les pays"
          persistent-hint
          variant="solo-filled" flat rounded="xl" density="comfortable"
          style="text-transform: uppercase;"
        >
          <template #prepend-inner><Icon icon="solar:global-line-duotone" width="18" /></template>
        </v-text-field>
      </div>
    </div>

    <div class="form-panel">
      <div class="toggle-row">
        <div>
          <div class="toggle-title">Taux par défaut</div>
          <div class="toggle-sub">Utilisé automatiquement si aucun taux spécifique ne s'applique</div>
        </div>
        <v-switch v-model="form.isDefault" density="compact" color="secondary" hide-details inset />
      </div>

      <div class="toggle-row">
        <div>
          <div class="toggle-title">Taux actif</div>
          <div class="toggle-sub">Un taux inactif n'est jamais appliqué au checkout</div>
        </div>
        <v-switch v-model="form.isActive" density="compact" color="secondary" hide-details inset />
      </div>
    </div>

    <div class="preview-panel">
      <div class="preview-head">
        <Icon icon="solar:eye-line-duotone" width="16" />
        Aperçu — sur un montant de 100€
      </div>
      <div v-if="form.rate" class="preview-row">
        <span>Taxe ({{ form.rate }}%)</span>
        <span>{{ (100 * (form.rate / 100)).toFixed(2) }}€</span>
      </div>
      <div v-else class="preview-empty">Renseigne un taux pour voir l'aperçu.</div>
    </div>

    <div class="form-nav">
      <v-btn color="secondary" variant="flat" rounded="xl" size="large" block :loading="saving" @click="onSubmit">
        <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
        {{ mode === 'create' ? 'Créer le taux' : 'Enregistrer les modifications' }}
      </v-btn>
    </div>

  </div>
</template>

<style scoped>
.form-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 20px; margin-bottom: 16px;
}
.form-panel h2 { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; margin-bottom: 16px; }

.field-row { display: grid; grid-template-columns: 1fr; gap: 12px; }

.toggle-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 0;
}
.toggle-row + .toggle-row { border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }
.toggle-title { font-size: 13px; font-weight: 700; }
.toggle-sub { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }

.preview-panel {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-xl); padding: 18px; margin-bottom: 20px;
}
.preview-head { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 10px; }
.preview-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; color: rgb(var(--v-theme-secondary)); }
.preview-empty { font-size: 12.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.form-nav { padding-bottom: 8px; }

@media (min-width: 640px) {
  .field-row { grid-template-columns: 2fr 1fr; }
}

@media (min-width: 960px) {
  .form-nav { display: flex; justify-content: flex-end; }
  .form-nav .v-btn { width: auto; min-width: 260px; }
}
</style> 