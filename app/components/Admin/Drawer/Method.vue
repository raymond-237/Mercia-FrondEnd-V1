<script setup lang="ts">
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import type { ShippingMethodFormData, ShippingZoneListItem } from '~/types/Models/shipping.type';

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  zones: ShippingZoneListItem[]
  initialData?: Partial<ShippingMethodFormData> & { id?: string }
  saving?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [boolean]; submit: [ShippingMethodFormData] }>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const schema = yup.object({
  name:  yup.string().required('Le nom est requis'),
  price: yup.number().typeError('Le prix doit être un nombre').min(0, 'Le prix doit être positif').required('Le prix est requis'),
  zone:  yup.string().required('La zone est requise').nullable(),
  maxDays: yup.number().nullable().min(yup.ref('minDays'), 'Doit être ≥ délai minimum'),
  methodType: yup.string().oneOf(['delivery', 'pickup']).required(),
  pickupAddress: yup.string().when('methodType', {
    is: 'pickup',
    then: (s) => s.required('L\'adresse de ramassage est requise'),
    otherwise: (s) => s.notRequired().nullable(),
  }),
  pickupPhone: yup.string().when('methodType', {
    is: 'pickup',
    then: (s) => s.required('Le téléphone de contact est requis'),
    otherwise: (s) => s.notRequired().nullable(),
  }),
})

const { validate, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    name: props.initialData?.name ?? '',
    price: props.initialData?.price ?? null,
    zone: props.initialData?.zone ?? null,
    minDays: props.initialData?.minDays ?? null,
    maxDays: props.initialData?.maxDays ?? null,
    methodType: props.initialData?.methodType ?? 'delivery',
    pickupAddress: props.initialData?.pickupAddress ?? '',
    pickupPhone: props.initialData?.pickupPhone ?? '',
  },
})

const { value: vName,  errorMessage: errName }  = useField<string>('name')
const { value: vPrice, errorMessage: errPrice } = useField<number | null>('price')
const { value: vZone,  errorMessage: errZone }  = useField<string | null>('zone')
const { value: vMinDays } = useField<number | null>('minDays')
const { value: vMaxDays, errorMessage: errMaxDays } = useField<number | null>('maxDays')
const { value: vType } = useField<'delivery' | 'pickup'>('methodType')
const { value: vPickupAddress, errorMessage: errPickupAddress } = useField<string>('pickupAddress')
const { value: vPickupPhone, errorMessage: errPickupPhone } = useField<string>('pickupPhone')

// Le switch pilote un booléen dans l'UI, mais la vraie source de vérité
// envoyée au backend reste vType ('delivery' | 'pickup').
const vIsPickup = computed({
  get: () => vType.value === 'pickup',
  set: (v: boolean) => { vType.value = v ? 'pickup' : 'delivery' },
})

const form = reactive<ShippingMethodFormData>({
  name: props.initialData?.name ?? '',
  carrierCode: props.initialData?.carrierCode ?? '',
  trackingUrl: props.initialData?.trackingUrl ?? '',
  minDays: props.initialData?.minDays ?? null,
  maxDays: props.initialData?.maxDays ?? null,
  price: props.initialData?.price ?? 0,
  freeAbove: props.initialData?.freeAbove ?? null,
  isActive: props.initialData?.isActive ?? true,
  zone: props.initialData?.zone ?? '',
  methodType: props.initialData?.methodType ?? 'delivery',
  pickupAddress: props.initialData?.pickupAddress ?? '',
  pickupHours: props.initialData?.pickupHours ?? '',
  pickupInstructions: props.initialData?.pickupInstructions ?? '',
  pickupPhone: props.initialData?.pickupPhone ?? '',
})

watch(vName, (v) => { form.name = v })
watch(vPrice, (v) => { form.price = v ?? 0 })
watch(vZone, (v) => { form.zone = v ?? '' })
watch(vMinDays, (v) => { form.minDays = v })
watch(vMaxDays, (v) => { form.maxDays = v })
watch(vType, (v) => {
  form.methodType = v
  // Si on désactive le ramassage, on vide les champs pour ne pas
  // envoyer des données obsolètes/fantômes au backend.
  if (v !== 'pickup') {
    form.pickupAddress = ''
    form.pickupHours = ''
    form.pickupInstructions = ''
    form.pickupPhone = ''
    vPickupAddress.value = ''
    vPickupPhone.value = ''
  }
})
watch(vPickupAddress, (v) => { form.pickupAddress = v ?? '' })
watch(vPickupPhone, (v) => { form.pickupPhone = v ?? '' })

const zoneOptions = computed(() => props.zones.map(z => ({ title: z.name, value: z.id })))

watch(() => props.initialData, (data) => {
  form.name        = data?.name ?? ''
  form.carrierCode  = data?.carrierCode ?? ''
  form.trackingUrl  = data?.trackingUrl ?? ''
  form.minDays       = data?.minDays ?? null
  form.maxDays        = data?.maxDays ?? null
  form.price            = data?.price ?? 0
  form.freeAbove         = data?.freeAbove ?? null
  form.isActive            = data?.isActive ?? true
  form.zone                  = data?.zone ?? ''
  form.methodType              = data?.methodType ?? 'delivery'
  form.pickupAddress           = data?.pickupAddress ?? ''
  form.pickupHours              = data?.pickupHours ?? ''
  form.pickupInstructions        = data?.pickupInstructions ?? ''
  form.pickupPhone                = data?.pickupPhone ?? ''
  resetForm({ values: {
    name: data?.name ?? '', price: data?.price ?? null, zone: data?.zone ?? null,
    minDays: data?.minDays ?? null, maxDays: data?.maxDays ?? null,
    methodType: data?.methodType ?? 'delivery',
    pickupAddress: data?.pickupAddress ?? '', pickupPhone: data?.pickupPhone ?? '',
  } })
})

async function onSubmit() {
  const { valid } = await validate()
  if (!valid) return
  emit('submit', { ...form })
}
</script>

<template>
  <v-navigation-drawer v-model="isOpen" temporary location="right" width="400">
    <div class="drawer">
      <div class="drawer-head">
        <h3>{{ mode === 'create' ? 'Nouvelle méthode' : 'Modifier la méthode' }}</h3>
        <v-btn icon variant="text" color="error" size="46" @click="isOpen = false">
          <Icon icon="solar:close-circle-line-duotone" width="29" />
        </v-btn>
      </div>

      <div class="drawer-body">
        <v-text-field
          v-model="vName" label="Nom" :error-messages="errName" placeholder="Ex: Standard, Express, Ramassage magasin"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:delivery-line-duotone" width="18" /></template>
        </v-text-field>

        <v-select
          v-model="vZone" :items="zoneOptions" label="Zone de livraison" :error-messages="errZone"
          variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:global-line-duotone" width="18" /></template>
        </v-select>

        <div class="field-row">
          <v-text-field v-model.number="vMinDays" label="Délai min (j)" type="number" variant="solo-filled" flat rounded="xl" density="comfortable">
            <template #prepend-inner><Icon icon="solar:clock-circle-line-duotone" width="18" /></template>
          </v-text-field>
          <v-text-field v-model.number="vMaxDays" label="Délai max (j)" type="number" :error-messages="errMaxDays" variant="solo-filled" flat rounded="xl" density="comfortable">
            <template #prepend-inner><Icon icon="solar:clock-circle-line-duotone" width="18" /></template>
          </v-text-field>
        </div>

        <div class="field-row">
          <v-text-field v-model.number="vPrice" label="Prix" type="number" suffix="€" :error-messages="errPrice" variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3">
            <template #prepend-inner><Icon icon="solar:wallet-money-line-duotone" width="18" /></template>
          </v-text-field>
          <v-text-field v-model.number="form.freeAbove" label="Gratuit dès (optionnel)" type="number" suffix="€" variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3">
            <template #prepend-inner><Icon icon="solar:gift-line-duotone" width="18" /></template>
          </v-text-field>
        </div>

        <v-text-field v-model="form.carrierCode" label="Code transporteur (optionnel)" variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3">
          <template #prepend-inner><Icon icon="solar:box-line-duotone" width="18" /></template>
        </v-text-field>

        <v-text-field v-model="form.trackingUrl" label="URL de suivi (optionnel)" variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3">
          <template #prepend-inner><Icon icon="solar:link-line-duotone" width="18" /></template>
        </v-text-field>

        <!-- Ramassage en magasin — bloc dédié, isolé visuellement des champs de livraison classique -->
        <div class="pickup-block" :class="{ 'pickup-block--active': vIsPickup }">
          <div class="toggle-row toggle-row--pickup">
            <div class="toggle-row-label">
              <Icon icon="solar:shop-line-duotone" width="20" />
              <div>
                <div class="toggle-label">Ramassage en magasin</div>
                <div class="toggle-sub">Active les infos de retrait (adresse, horaires...)</div>
              </div>
            </div>
            <v-switch v-model="vIsPickup" color="secondary" hide-details density="compact" />
          </div>

          <v-expand-transition>
            <div v-if="vIsPickup" class="pickup-fields">
              <v-text-field
                v-model="vPickupAddress" label="Adresse de ramassage" :error-messages="errPickupAddress"
                placeholder="Ex: 12 Via Roma, Milano" variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
              >
                <template #prepend-inner><Icon icon="solar:map-point-line-duotone" width="18" /></template>
              </v-text-field>

              <!-- <v-text-field
                v-model="vPickupPhone" label="Téléphone de contact" :error-messages="errPickupPhone"
                placeholder="Ex: +39 02 1234 5678" variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
              >
                <template #prepend-inner><Icon icon="solar:phone-line-duotone" width="18" /></template>
              </v-text-field> -->

                <UiPhoneInput
                v-model="vPickupPhone"
                label="Téléphone de contact"
                :error-messages="errPickupPhone"
                 placeholder="Ex: +39 02 1234 5678"
                 class="mb-3"
              />

              <v-text-field
                v-model="form.pickupHours" label="Horaires d'ouverture (optionnel)"
                placeholder="Ex: Lun-Ven 9h-18h, Sam 10h-13h" variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
              >
                <template #prepend-inner><Icon icon="solar:calendar-line-duotone" width="18" /></template>
              </v-text-field>

              <v-textarea
                v-model="form.pickupInstructions" label="Instructions de retrait (optionnel)"
                placeholder="Ex: Sonner à l'interphone 'Afro Extension', 2e étage"
                variant="solo-filled" flat rounded="xl" density="comfortable" rows="3" auto-grow class="mb-1"
              >
                <template #prepend-inner><Icon icon="solar:document-text-line-duotone" width="18" /></template>
              </v-textarea>
            </div>
          </v-expand-transition>
        </div>

        <div class="toggle-row">
          <div>
            <div class="toggle-label">Méthode active</div>
            <div class="toggle-sub">Visible au checkout si activée</div>
          </div>
          <v-switch v-model="form.isActive" color="secondary" hide-details density="compact" />
        </div>
      </div>

      <div class="drawer-foot mx-auto">
        <v-btn variant="tonal" color="primary" rounded="xl"  @click="isOpen = false">Annuler</v-btn>
        <v-btn color="secondary" variant="flat" rounded="xl" bock :loading="saving" @click="onSubmit">
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
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 4px; }

.toggle-row { display: flex; align-items: center; justify-content: space-between; background: rgb(var(--v-theme-surface-variant)); border-radius: var(--r-lg); padding: 14px 16px; margin-top: 6px; }
.toggle-row-label { display: flex; align-items: center; gap: 10px; }
.toggle-label { font-size: 13px; font-weight: 700; }
.toggle-sub { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); }

.pickup-block {
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-lg);
  padding: 4px;
  margin-top: 10px;
  margin-bottom: 6px;
  transition: border-color .2s;
}
.pickup-block--active { border-color: rgb(var(--v-theme-secondary)); }
.toggle-row--pickup { background: transparent; margin-top: 0; }
.pickup-fields { padding: 12px 12px 4px; }

.drawer-foot { display: flex; gap: 10px; padding: 16px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }
</style>