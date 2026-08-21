<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useAdminSettingsStore } from '~/stores/Models/settings.store'
import type { PaymentFormData } from '~/types/Models/settings.type'

definePageMeta({ layout: 'admin' })

const store = useAdminSettingsStore()

const form = reactive<PaymentFormData>({
  paypal: { enabled: true, clientId: null, secret: null },
  bankTransfer: { enabled: false, iban: null, bic: null, accountHolder: null, bankName: null },
  cash: { enabled: false },
})

const secretPlaceholder = ref(false)

watch(() => store.settings, (s) => {
  if (!s) return
  form.paypal.enabled       = s.payment.paypal.enabled
  form.paypal.clientId      = s.payment.paypal.clientId
  form.bankTransfer.enabled       = s.payment.bankTransfer.enabled
  form.bankTransfer.iban          = s.payment.bankTransfer.iban
  form.bankTransfer.bic           = s.payment.bankTransfer.bic
  form.bankTransfer.accountHolder = s.payment.bankTransfer.accountHolder
  form.bankTransfer.bankName      = s.payment.bankTransfer.bankName
  form.cash.enabled = s.payment.cash.enabled
  secretPlaceholder.value = s.payment.paypal.configured
}, { immediate: true })

const noMethodActive = computed(() =>
  !form.paypal.enabled && !form.bankTransfer.enabled && !form.cash.enabled
)

const ibanMissing = computed(() => form.bankTransfer.enabled && !form.bankTransfer.iban)

// ── Masquage IBAN — révélé uniquement à la demande, comme le secret PayPal.
// Se re-masque automatiquement après sauvegarde, pour ne pas laisser un
// écran de réglages sensibles ouvert en clair sur un poste partagé.

const ibanRevealed = ref(false)

const ibanMasked = computed(() => {
  const raw = form.bankTransfer.iban
  if (!raw) return ''
  const clean = raw.replace(/\s+/g, '')
  if (clean.length <= 4) return clean
  return `${'•'.repeat(clean.length - 4)}${clean.slice(-4)}`.replace(/(.{4})/g, '$1 ').trim()
})

// Feedback visuel non-bloquant — la vraie validation (checksum mod-97) reste
// côté serveur, ceci sert juste à rassurer l'admin en temps réel pendant la saisie.
const ibanLooksValid = computed(() => {
  const raw = form.bankTransfer.iban?.replace(/\s+/g, '').toUpperCase()
  return !!raw && /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(raw)
})

async function copyIban() {
  if (!form.bankTransfer.iban || import.meta.server) return
  await navigator.clipboard.writeText(form.bankTransfer.iban.replace(/\s+/g, ''))
  notify({ message: 'IBAN copié.', color: 'success', timeout: 2000 })
}

const bankTransferConfigured = computed(() => !!form.bankTransfer.iban)

async function onSubmit() {
  if (noMethodActive.value) {
    notify({ message: 'Au moins un moyen de paiement doit rester actif.', color: 'error', timeout: 4000 })
    return
  }
  if (ibanMissing.value) {
    notify({ message: "L'IBAN est requis pour activer le virement bancaire.", color: 'error', timeout: 4000 })
    return
  }

  const success = await store.savePayment(form)
  if (success) {
    form.paypal.secret = null
    ibanRevealed.value = false
  }
  notify({
    message: success ? 'Réglages de paiement enregistrés.' : (store.error ?? 'Une erreur est survenue.'),
    color: success ? 'success' : 'error',
    timeout: 3000,
  })
}
</script>

<template>
  <div>
    <div v-if="store.loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <template v-else>
      <!-- PAYPAL -->
      <div class="panel">
        <div class="panel-head">
          <div class="method-icon"><Icon icon="solar:card-line-duotone" width="20" /></div>
          <div>
            <h2>PayPal</h2>
            <p class="panel-hint">Identifiants de ton application PayPal Developer.</p>
          </div>
          <v-chip
            v-if="form.paypal.enabled"
            size="small" variant="tonal"
            :color="secretPlaceholder ? 'success' : 'warning'"
            class="ml-auto"
          >
            {{ secretPlaceholder ? 'Configuré' : 'Incomplet' }}
          </v-chip>
          <v-switch
            v-model="form.paypal.enabled"
            density="compact" color="secondary" hide-details inset
            :class="form.paypal.enabled ? 'ml-3' : 'ml-auto'"
          />
        </div>

        <template v-if="form.paypal.enabled">
          <v-text-field 
            v-model="form.paypal.clientId" label="Client ID"
            variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
          >
            <template #prepend-inner><Icon icon="solar:key-line-duotone" width="18" /></template>
          </v-text-field>

          <v-text-field
            v-model="form.paypal.secret" label="Secret"
            :placeholder="secretPlaceholder ? '••••••••••••••••' : 'Non configuré'"
            type="password"
            :hint="secretPlaceholder ? 'Laisse vide pour garder le secret actuel' : undefined"
            persistent-hint
            variant="solo-filled" flat rounded="xl" density="comfortable"
          >
            <template #prepend-inner><Icon icon="solar:lock-password-line-duotone" width="18" /></template>
          </v-text-field>
        </template>
      </div>

      <!-- VIREMENT BANCAIRE -->
      <div class="panel">
        <div class="panel-head">
          <div class="method-icon"><Icon icon="solar:banknote-2-line-duotone" width="20" /></div>
          <div>
            <h2>Virement bancaire</h2>
            <p class="panel-hint">Affiché au client après sélection au checkout. Désactivé = totalement masqué, IBAN inclus.</p>
          </div>
          <v-chip
            v-if="form.bankTransfer.enabled"
            size="small" variant="tonal"
            :color="bankTransferConfigured ? 'success' : 'warning'"
            class="ml-auto"
          >
            {{ bankTransferConfigured ? 'Configuré' : 'Incomplet' }}
          </v-chip>
          <v-switch
            v-model="form.bankTransfer.enabled"
            density="compact" color="secondary" hide-details inset
            :class="form.bankTransfer.enabled ? 'ml-3' : 'ml-auto'"
          />
        </div>

        <template v-if="form.bankTransfer.enabled">
          <div class="iban-field-wrap mb-3">
            <v-text-field
              :model-value="ibanRevealed ? form.bankTransfer.iban : ibanMasked"
              @update:model-value="v => { if (ibanRevealed) form.bankTransfer.iban = v }"
              label="IBAN *"
              :readonly="!ibanRevealed"
              :error="ibanMissing"
              :error-messages="ibanMissing ? ['IBAN requis pour activer le virement.'] : []"
              variant="solo-filled" flat rounded="xl" density="comfortable"
            >
              <template #prepend-inner><Icon icon="solar:hashtag-square-line-duotone" width="18" /></template>
              <template #append-inner>
                <Icon
                  v-if="form.bankTransfer.iban && ibanLooksValid"
                  icon="solar:check-circle-bold-duotone" width="16"
                  class="iban-valid-icon"
                />
                <button type="button" class="iban-icon-btn" :disabled="!form.bankTransfer.iban" @click="copyIban">
                  <Icon icon="solar:copy-line-duotone" width="17" />
                </button>
                <button type="button" class="iban-icon-btn" @click="ibanRevealed = !ibanRevealed">
                  <Icon :icon="ibanRevealed ? 'solar:eye-closed-line-duotone' : 'solar:eye-line-duotone'" width="18" />
                </button>
              </template>
            </v-text-field>
            <p v-if="form.bankTransfer.iban && !ibanLooksValid" class="iban-format-hint">
              Format IBAN inhabituel — vérifie avant d'enregistrer.
            </p>
          </div>

          <v-text-field
            v-model="form.bankTransfer.bic" label="BIC / SWIFT"
            variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
          >
            <template #prepend-inner><Icon icon="solar:global-line-duotone" width="18" /></template>
          </v-text-field>

          <v-text-field
            v-model="form.bankTransfer.accountHolder" label="Titulaire du compte"
            variant="solo-filled" flat rounded="xl" density="comfortable" class="mb-3"
          >
            <template #prepend-inner><Icon icon="solar:user-id-line-duotone" width="18" /></template>
          </v-text-field>

          <v-text-field
            v-model="form.bankTransfer.bankName" label="Nom de la banque"
            variant="solo-filled" flat rounded="xl" density="comfortable"
          >
            <template #prepend-inner><Icon icon="solar:buildings-2-line-duotone" width="18" /></template>
          </v-text-field>
        </template>
      </div>

      <!-- CASH / RETRAIT -->
      <div class="panel">
        <div class="panel-head">
          <div class="method-icon"><Icon icon="solar:wallet-money-line-duotone" width="20" /></div>
          <div>
            <h2>Paiement en espèces</h2>
            <p class="panel-hint">Réservé au retrait en magasin. L'adresse de ramassage reste gérée dans les méthodes de livraison.</p>
          </div>
          <v-chip
            v-if="form.cash.enabled"
            size="small" variant="tonal" color="success"
            class="ml-auto"
          >
            Actif
          </v-chip>
          <v-switch
            v-model="form.cash.enabled"
            density="compact" color="secondary" hide-details inset
            :class="form.cash.enabled ? 'ml-3' : 'ml-auto'"
          />
        </div>
      </div>

      <v-alert
        v-if="noMethodActive"
        type="warning" variant="tonal" rounded="xl" density="compact" class="mb-4"
      >
        Au moins un moyen de paiement doit rester actif, sinon le checkout sera bloqué pour tes clients.
      </v-alert>

      <div class="panel-foot standalone">
        <v-btn color="secondary" variant="flat" rounded="xl" :loading="store.saving" @click="onSubmit">
          <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
          Enregistrer
        </v-btn>
      </div>
    </template>
  </div>
</template>

<style scoped>
.loading-block {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl);
  padding: 20px;
  margin-bottom: 16px;
}

.panel h2 {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}

.panel-hint {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 0;
  line-height: 1.5;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 16px;
}

.panel-head h2,
.panel-head .panel-hint {
  margin-bottom: 0;
}

.method-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--r-md);
  background: rgba(var(--v-theme-secondary), 0.1);
  color: rgb(var(--v-theme-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 6px;
}

.iban-field-wrap :deep(input) {
  font-family: 'Fraunces', serif;
  letter-spacing: 0.03em;
}

.iban-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  color: rgb(var(--v-theme-on-surface-variant));
  transition: color .15s;
}
.iban-icon-btn:hover:not(:disabled) { color: rgb(var(--v-theme-secondary)); }
.iban-icon-btn:disabled { opacity: 0.35; cursor: default; }

.iban-valid-icon {
  color: #4C7A4C;
  margin-right: 2px;
}

.iban-format-hint {
  font-size: 11px;
  color: rgb(var(--v-theme-warning));
  margin-top: 4px;
  padding-left: 4px;
}

.panel-foot.standalone {
  display: flex;
  justify-content: flex-end;
}
</style>