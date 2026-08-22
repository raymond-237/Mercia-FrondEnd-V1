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

// Défaut sensé selon le type — pickup propose cash d'office, la livraison
// classique ne le propose jamais tant qu'on ne repasse pas en pickup.
function defaultPaymentMethods(type: 'delivery' | 'pickup'): string[] {
  return type === 'pickup' ? ['cash', 'paypal', 'bank_transfer'] : ['paypal', 'bank_transfer']
}

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
  allowedPaymentMethods: props.initialData?.allowedPaymentMethods
    ?? defaultPaymentMethods(props.initialData?.methodType ?? 'delivery'),
})

watch(vName, (v) => { form.name = v })
watch(vPrice, (v) => { form.price = v ?? 0 })
watch(vZone, (v) => { form.zone = v ?? '' })
watch(vMinDays, (v) => { form.minDays = v })
watch(vMaxDays, (v) => { form.maxDays = v })
watch(vType, (v) => {
  form.methodType = v
  if (v !== 'pickup') {
    form.pickupAddress = ''
    form.pickupHours = ''
    form.pickupInstructions = ''
    form.pickupPhone = ''
    vPickupAddress.value = ''
    vPickupPhone.value = ''
    form.allowedPaymentMethods = form.allowedPaymentMethods.filter(m => m !== 'cash')
  } else if (!form.allowedPaymentMethods.includes('cash')) {
    form.allowedPaymentMethods = [...form.allowedPaymentMethods, 'cash']
  }
})
watch(vPickupAddress, (v) => { form.pickupAddress = v ?? '' })
watch(vPickupPhone, (v) => { form.pickupPhone = v ?? '' })

function togglePaymentMethod(method: string) {
  const idx = form.allowedPaymentMethods.indexOf(method)
  if (idx === -1) form.allowedPaymentMethods.push(method)
  else form.allowedPaymentMethods.splice(idx, 1)
}

const PAYMENT_OPTIONS = [
  { value: 'paypal',        label: 'PayPal',            icon: 'solar:card-line-duotone' },
  { value: 'bank_transfer', label: 'Virement bancaire', icon: 'solar:banknote-2-line-duotone' },
  { value: 'cash',          label: 'Espèces',           icon: 'solar:wallet-money-line-duotone', pickupOnly: true },
]

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
  form.allowedPaymentMethods        = data?.allowedPaymentMethods
    ?? defaultPaymentMethods(data?.methodType ?? 'delivery')
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

        <div class="payment-block">
          <div class="payment-block-title">
            <Icon icon="solar:card-line-duotone" width="16" />
            Paiements autorisés
          </div>
          <div class="payment-options">
            <button
              v-for="opt in PAYMENT_OPTIONS" :key="opt.value"
              type="button"
              class="payment-chip"
              :class="{
                active: form.allowedPaymentMethods.includes(opt.value),
                disabled: opt.pickupOnly && !vIsPickup,
              }"
              :disabled="opt.pickupOnly && !vIsPickup"
              @click="togglePaymentMethod(opt.value)"
            >
              <Icon :icon="opt.icon" width="16" />
              {{ opt.label }}
              <Icon v-if="form.allowedPaymentMethods.includes(opt.value)" icon="solar:check-circle-bold-duotone" width="14" class="payment-chip-check" />
            </button>
          </div>
          <p v-if="!vIsPickup" class="payment-hint">
            <Icon icon="solar:info-circle-line-duotone" width="12" />
            Espèces réservé aux méthodes de ramassage en magasin.
          </p>
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

.payment-block {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg);
  padding: 14px 16px;
  margin-top: 10px;
  margin-bottom: 6px;
}
.payment-block-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 10px;
}
.payment-options { display: flex; flex-wrap: wrap; gap: 8px; }
.payment-chip {
  display: flex; align-items: center; gap: 6px;
  background: rgb(var(--v-theme-surface));
  border: 1.5px solid transparent; border-radius: var(--r-full);
  padding: 7px 12px 7px 14px; font-size: 12px; font-weight: 700;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer; transition: border-color .2s, color .2s;
}
.payment-chip.active {
  border-color: rgb(var(--v-theme-secondary));
  color: rgb(var(--v-theme-secondary));
}
.payment-chip.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.payment-chip-check { color: rgb(var(--v-theme-secondary)); }
.payment-hint {
  display: flex; align-items: center; gap: 5px;
  font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant));
  margin: 8px 0 0;
}

.drawer-foot { display: flex; gap: 10px; padding: 16px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }
</style>