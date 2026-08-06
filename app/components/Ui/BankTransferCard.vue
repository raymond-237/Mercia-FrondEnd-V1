<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  beneficiary: string
  iban: string
  bic?: string
  amount: number
  reference: string
}>()

const { t } = useI18n()
const toast = useToast()

const copiedField = ref<string | null>(null)

function formatIban(iban: string): string {
  return iban.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim()
}

async function copyField(field: string, value: string) {
  if (import.meta.client) {
    await navigator.clipboard.writeText(value)
    navigator.vibrate?.(10)
  }
  copiedField.value = field
  setTimeout(() => { copiedField.value = null }, 1500)
}

async function copyAll() {
  const block = [
    `${t('checkout.bankCard.beneficiary')}: ${props.beneficiary}`,
    `IBAN: ${formatIban(props.iban)}`,
    props.bic ? `BIC: ${props.bic}` : null,
    `${t('checkout.bankCard.amount')}: ${props.amount.toFixed(2)}€`,
    `${t('checkout.bankCard.reference')}: ${props.reference}`,
  ].filter(Boolean).join('\n')

  if (import.meta.client) {
    await navigator.clipboard.writeText(block)
    navigator.vibrate?.(12)
  }
  toast.success(t('checkout.bankCard.copiedAll'))
}
</script>

<template>
  <div class="bank-card">
    <div class="bank-card-glow" />

    <div class="bank-card-header">
      <Icon icon="solar:card-2-bold-duotone" width="22" />
      <span>{{ t('checkout.bankCard.title') }}</span>
    </div>

    <button class="iban-block" @click="copyField('iban', iban)">
      <span class="iban-label">IBAN</span>
      <span class="iban-value">{{ formatIban(iban) }}</span>
      <Icon
        :icon="copiedField === 'iban' ? 'solar:check-circle-bold-duotone' : 'solar:copy-line-duotone'"
        width="18"
        class="field-copy-icon"
      />
    </button>

    <div class="bank-card-fields">
      <button class="field-row" @click="copyField('beneficiary', beneficiary)">
        <div class="field-text">
          <span class="field-label">{{ t('checkout.bankCard.beneficiary') }}</span>
          <span class="field-value">{{ beneficiary }}</span>
        </div>
        <Icon
          :icon="copiedField === 'beneficiary' ? 'solar:check-circle-bold-duotone' : 'solar:copy-line-duotone'"
          width="16"
        />
      </button>

      <button v-if="bic" class="field-row" @click="copyField('bic', bic)">
        <div class="field-text">
          <span class="field-label">BIC / SWIFT</span>
          <span class="field-value">{{ bic }}</span>
        </div>
        <Icon
          :icon="copiedField === 'bic' ? 'solar:check-circle-bold-duotone' : 'solar:copy-line-duotone'"
          width="16"
        />
      </button>

      <button class="field-row" @click="copyField('amount', amount.toFixed(2))">
        <div class="field-text">
          <span class="field-label">{{ t('checkout.bankCard.amount') }}</span>
          <span class="field-value field-value-amount">{{ amount.toFixed(2) }}€</span>
        </div>
        <Icon
          :icon="copiedField === 'amount' ? 'solar:check-circle-bold-duotone' : 'solar:copy-line-duotone'"
          width="16"
        />
      </button>

      <button class="field-row" @click="copyField('reference', reference)">
        <div class="field-text">
          <span class="field-label">{{ t('checkout.bankCard.reference') }}</span>
          <span class="field-value">{{ reference }}</span>
        </div>
        <Icon
          :icon="copiedField === 'reference' ? 'solar:check-circle-bold-duotone' : 'solar:copy-line-duotone'"
          width="16"
        />
      </button>
    </div>

    <v-btn
      block rounded="pill" variant="flat" color="secondary" size="large"
      class="copy-all-btn"
      @click="copyAll"
    >
      <Icon icon="solar:copy-line-duotone" width="16" style="margin-right: 8px;" />
      {{ t('checkout.bankCard.copyAll') }}
    </v-btn>

    <p class="reference-warning">
      <Icon icon="solar:danger-triangle-line-duotone" width="13" />
      {{ t('checkout.bankCard.referenceWarning') }}
    </p>
  </div>
</template>

<style scoped>
.bank-card {
  position: relative;
  overflow: hidden;
  background: rgb(var(--v-theme-primary));
  border-radius: var(--r-xl);
  padding: 20px;
  color: #FAFAF8;
}

.bank-card-glow {
  position: absolute;
  width: 200px; height: 200px;
  background: radial-gradient(circle, #C68A52 0%, transparent 70%);
  opacity: 0.18;
  border-radius: 50%;
  top: -70px; right: -50px;
  pointer-events: none;
}

.bank-card-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: rgba(250, 250, 248, 0.75);
  margin-bottom: 16px;
  position: relative;
}

.iban-block {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  background: rgba(250, 250, 248, 0.08);
  border: 1px solid rgba(250, 250, 248, 0.14);
  border-radius: var(--r-lg);
  padding: 14px 16px;
  margin-bottom: 14px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.iban-block:active { background: rgba(250, 250, 248, 0.14); }

.iban-label {
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  color: rgba(250, 250, 248, 0.6);
}
.iban-value {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.04em;
  word-break: break-all;
}
.field-copy-icon {
  position: absolute;
  top: 14px; right: 14px;
  color: rgba(250, 250, 248, 0.7);
}

.bank-card-fields {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 16px;
  border-radius: var(--r-lg);
  overflow: hidden;
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 4px;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(250, 250, 248, 0.1);
  cursor: pointer;
  text-align: left;
  color: #FAFAF8;
}
.field-row:last-child { border-bottom: none; }

.field-text { display: flex; flex-direction: column; gap: 1px; }
.field-label {
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: rgba(250, 250, 248, 0.55);
}
.field-value { font-size: 13px; font-weight: 600; }
.field-value-amount { font-family: 'Fraunces', serif; font-size: 16px; color: #E8C78A; }

.field-row :deep(svg) { color: rgba(250, 250, 248, 0.5); flex-shrink: 0; }

.copy-all-btn { margin-bottom: 10px; }

.reference-warning {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 10.5px;
  line-height: 1.5;
  color: rgba(250, 250, 248, 0.65);
  position: relative;
}
.reference-warning :deep(svg) { flex-shrink: 0; margin-top: 1px; color: #E8C78A; }
</style>