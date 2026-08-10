<script setup lang="ts">

import { notify } from '~/@cores/constantes/helpers'
import { carrier } from '../../types';

const props = defineProps<{
  modelValue: boolean
  orderNumber: string
  isPickup?: boolean
}>()


 const CARRIERS: carrier[] = [
  { code: 'poste_italiane', name: 'Poste Italiane (SDA)', trackingUrlPattern: 'https://www.poste.it/cerca/index.html#/risultati-spedizioni/{trackingNumber}' },
  { code: 'brt',            name: 'BRT (Bartolini)',      trackingUrlPattern: 'https://vas.brt.it/vas/sped_det_show.hsm?Nspediz={trackingNumber}' },
  { code: 'gls',            name: 'GLS',                  trackingUrlPattern: 'https://gls-group.eu/IT/it/servizi-online/ricerca-spedizioni?match={trackingNumber}' },
  { code: 'dhl',            name: 'DHL',                  trackingUrlPattern: 'https://www.dhl.com/it-it/home/tracking.html?tracking-id={trackingNumber}' },
  { code: 'ups',            name: 'UPS',                  trackingUrlPattern: 'https://www.ups.com/track?tracknum={trackingNumber}' },
  { code: 'fedex',          name: 'FedEx',                trackingUrlPattern: 'https://www.fedex.com/fedextrack/?trknbr={trackingNumber}' },
  { code: 'dpd',            name: 'DPD',                  trackingUrlPattern: 'https://tracking.dpd.de/status/it_IT/parcel/{trackingNumber}' },
  { code: 'inpost',         name: 'InPost (point relais)', trackingUrlPattern: 'https://inpost.it/tracking/{trackingNumber}' },
]

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [payload: { carrierCode: string | null; trackingNumber: string | null }]
}>()

const carrierCode     = ref<string | null>(null)
const trackingNumber  = ref('')
const submitting      = ref(false)

const carrierOptions = CARRIERS.map(c => ({ title: c.name, value: c.code }))

const trackingUrlPreview = computed(() =>
  carrierCode.value ? buildTrackingUrl(carrierCode.value, trackingNumber.value) : null
)

// En ramassage, pas de transporteur/tracking à saisir — la confirmation
// suffit à faire passer la commande à "prête pour le retrait".
const isValid = computed(() =>
  props.isPickup || (!!carrierCode.value && trackingNumber.value.trim().length > 0)
)

function close() {
  emit('update:modelValue', false)
}

function reset() {
  carrierCode.value    = null
  trackingNumber.value = ''
}

async function onConfirm() {
  if (!isValid.value) {
    notify({ message: 'Sélectionne un transporteur et renseigne le numéro de suivi.', color: 'error', timeout: 3500 })
    return
  }

  submitting.value = true
  try {
    emit('confirm', props.isPickup
      ? { carrierCode: null, trackingNumber: null }
      : { carrierCode: carrierCode.value!, trackingNumber: trackingNumber.value.trim() },
    )
    reset()
    close()
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <div class="ship-dialog">
      <div class="dialog-head">
        <div class="dialog-icon">
          <Icon :icon="isPickup ? 'solar:shop-line-duotone' : 'solar:delivery-line-duotone'" width="20" />
        </div>
        <div>
          <h2>{{ isPickup ? 'Marquer prête pour le retrait' : 'Marquer comme expédiée' }}</h2>
          <p class="dialog-sub">Commande {{ orderNumber }}</p>
        </div>
      </div>

      <template v-if="isPickup">
        <p class="pickup-note">
          Le client recevra une notification l'informant que sa commande est disponible en magasin.
        </p>
      </template>

      <template v-else>
        <v-select
          v-model="carrierCode"
          label="Transporteur"
          :items="carrierOptions"
          variant="solo-filled" flat rounded="xl" density="comfortable"
          class="mb-3"
        >
          <template #prepend-inner><Icon icon="solar:box-line-duotone" width="18" /></template>
        </v-select>

        <v-text-field
          v-model="trackingNumber"
          label="Numéro de suivi"
          variant="solo-filled" flat rounded="xl" density="comfortable"
        >
          <template #prepend-inner><Icon icon="solar:hashtag-square-line-duotone" width="18" /></template>
        </v-text-field>

        <a
          v-if="trackingUrlPreview"
          :href="trackingUrlPreview" target="_blank" rel="noopener"
          class="tracking-preview-link"
        >
          <Icon icon="solar:link-line-duotone" width="14" />
          Vérifier le suivi
        </a>
      </template>

      <div class="dialog-actions">
        <v-btn variant="text" rounded="xl" @click="close">Annuler</v-btn>
        <v-btn color="secondary" variant="flat" rounded="xl" :loading="submitting" :disabled="!isValid" @click="onConfirm">
          <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
          {{ isPickup ? 'Confirmer' : "Confirmer l'expédition" }}
        </v-btn>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
.ship-dialog {
  background: rgb(var(--v-theme-surface));
  border-radius: var(--r-xl);
  padding: 22px;
}

.dialog-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.dialog-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--r-md);
  background: rgba(var(--v-theme-secondary), 0.1);
  color: rgb(var(--v-theme-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dialog-head h2 {
  font-family: 'Fraunces', serif;
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 2px;
}

.dialog-sub {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.pickup-note {
  font-size: 13px;
  line-height: 1.6;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg);
  padding: 14px;
  margin-bottom: 4px;
}

.tracking-preview-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-secondary));
  text-decoration: none;
  margin-top: -4px;
  margin-bottom: 12px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>