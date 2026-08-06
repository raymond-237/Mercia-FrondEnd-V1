<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'

const props = defineProps<{
  modelValue: boolean
  orderNumber: string
  paymentMethod: 'cash' | 'bank_transfer'
  amount: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [payload: { note: string }]
}>()

const { user } = useAuthentication()
const submitting = ref(false)
const note        = ref('')

const methodLabel = computed(() =>
  props.paymentMethod === 'bank_transfer' ? 'Virement bancaire' : 'Espèces'
)

function buildDefaultNote(): string {
  const adminName = user.value?.data?.attributes
    ? `${user.value.data.attributes.firstname ?? ''} ${user.value.data.attributes.lastname ?? ''}`.trim()
    : 'Admin'
  const date = new Date().toLocaleDateString('fr-FR')

  return props.paymentMethod === 'bank_transfer'
    ? `Virement reçu et vérifié sur le compte — ${adminName}, ${date}.`
    : `Paiement en espèces reçu et vérifié — ${adminName}, ${date}.`
}

// Pré-remplie à chaque ouverture — l'admin peut la modifier mais ne part
// jamais d'un champ vide, ça évite la friction du "qu'est-ce que je dois écrire".
watch(() => props.modelValue, (open) => {
  if (open) note.value = buildDefaultNote()
})

const isValid = computed(() => note.value.trim().length > 0)

function close() {
  emit('update:modelValue', false)
}

async function onConfirm() {
  if (!isValid.value) {
    notify({ message: 'La note de confirmation est obligatoire.', color: 'error', timeout: 3500 })
    return
  }

  submitting.value = true
  try {
    emit('confirm', { note: note.value.trim() })
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
    <div class="paid-dialog">
      <div class="dialog-head">
        <div class="dialog-icon">
          <Icon icon="solar:check-circle-line-duotone" width="20" />
        </div>
        <div>
          <h2>Marquer comme payée</h2>
          <p class="dialog-sub">Commande {{ orderNumber }} · {{ methodLabel }} · {{ amount.toFixed(2) }}€</p>
        </div>
      </div>

      <v-textarea
        v-model="note"
        label="Note de confirmation"
        :error="!isValid"
        :error-messages="!isValid ? ['La note est obligatoire.'] : []"
        variant="solo-filled" flat rounded="xl" density="comfortable"
        rows="3" auto-grow
        hint="Pré-remplie automatiquement — modifie-la si besoin avant de valider."
        persistent-hint
      >
        <template #prepend-inner><Icon icon="solar:document-text-line-duotone" width="18" /></template>
      </v-textarea>

      <div class="dialog-actions">
        <v-btn variant="text" rounded="xl" @click="close">Annuler</v-btn>
        <v-btn color="secondary" variant="flat" rounded="xl" :loading="submitting" :disabled="!isValid" @click="onConfirm">
          <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
          Confirmer le paiement
        </v-btn>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
.paid-dialog {
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
  background: rgba(76, 122, 76, 0.12);
  color: #4C7A4C;
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

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
</style>