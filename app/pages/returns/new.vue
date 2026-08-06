<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, ref, onMounted } from 'vue'
import { useReturnsStore } from '~/stores/Models/returns.store'
import type { ReturnResolution } from '~/types/public/index.type'

definePageMeta({ layout: 'form' })

const { t } = useI18n()
const returnsStore = useReturnsStore()

onMounted(() => {
  if (!returnsStore.order || !returnsStore.isTokenValid) {
    navigateTo('/returns')
  }
})

const order = computed(() => returnsStore.order)

const motifs = computed(() => [
  t('returns.motifs.defective'),
  t('returns.motifs.notAsDescribed'),
  t('returns.motifs.wrongSize'),
  t('returns.motifs.changedMind'),
  t('returns.motifs.other'),
])

const resolutions = computed<{ value: ReturnResolution; label: string; icon: string }[]>(() => [
  { value: 'refund',       label: t('returns.resolutions.refund'),      icon: 'solar:card-transfer-line-duotone' },
  { value: 'exchange',     label: t('returns.resolutions.exchange'),    icon: 'solar:refresh-line-duotone' },
  { value: 'store_credit', label: t('returns.resolutions.storeCredit'), icon: 'solar:wallet-money-line-duotone' },
])

const selectedItems  = ref<Record<string, boolean>>({})
const itemQuantities = ref<Record<string, number>>({})
const motif          = ref('')
const resolution     = ref<ReturnResolution>('refund')
const notes          = ref('')
const submitted      = ref(false)

function initItem(id: string, orderedQty: number) {
  if (!(id in selectedItems.value)) {
    selectedItems.value = { ...selectedItems.value, [id]: false }
    itemQuantities.value = { ...itemQuantities.value, [id]: orderedQty }
  }
}

function toggleItem(item: any) {
  const orderedQty = item.quantity ?? 1
  initItem(item.id, orderedQty)
  selectedItems.value = { ...selectedItems.value, [item.id]: !selectedItems.value[item.id] }
}

/**
 * Mutation immuable (nouvel objet à chaque appel) — garantit que Vue
 * détecte le changement et recalcule estimatedRefund à chaque clic.
 */
function incrementQty(id: string, max: number) {
  const current = itemQuantities.value[id] ?? 1
  itemQuantities.value = { ...itemQuantities.value, [id]: Math.min(max, current + 1) }
}
function decrementQty(id: string) {
  const current = itemQuantities.value[id] ?? 1
  itemQuantities.value = { ...itemQuantities.value, [id]: Math.max(1, current - 1) }
}

const hasSelection = computed(() =>
  Object.values(selectedItems.value).some(Boolean) && !!motif.value
)

/**
 * Total remboursement estimé — calculé à partir des vraies données de
 * commande (prix unitaire réel). Le montant final reste toujours
 * recalculé côté backend au traitement de la demande.
 */
const estimatedRefund = computed(() => {
  if (!order.value) return 0
  return order.value.items.reduce((sum: number, item: any) => {
    if (!selectedItems.value[item.id]) return sum
    const qty       = itemQuantities.value[item.id] ?? item.quantity ?? 1
    const unitPrice = item.unitPrice ?? item.unit_price ?? 0
    return sum + qty * unitPrice
  }, 0)
})

const selectedCount = computed(
  () => Object.values(selectedItems.value).filter(Boolean).length
)

async function onSubmit() {
  const items = Object.entries(selectedItems.value)
    .filter(([, selected]) => selected)
    .map(([itemId]) => ({
      orderItemId: itemId,
      quantity: itemQuantities.value[itemId] ?? 1,
      resolution: resolution.value,
    }))

  const result = await returnsStore.submitReturn({
    reason: motif.value,
    notes: notes.value || undefined,
    items,
  })

  if (result) {
    submitted.value = true
  }
}
</script>

<template>
  <div>

    <div class="content">
      <div class="returns-wrapper">

        <Transition name="fade" mode="out-in">

          <div v-if="!submitted" key="form">

            <div class="page-header">
              <NuxtLink to="/returns" class="back-link">
                <Icon icon="solar:alt-arrow-left-line-duotone" width="18" />
                {{ t('returns.new.back') }}
              </NuxtLink>
              <h1 v-if="order">{{ order.orderNumber }}</h1>
            </div>

            <div v-if="order">

              <div class="section-label">{{ t('returns.new.selectItems') }}</div>
              <div class="items-list">
                <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="return-item-card"
                  :class="{ selected: selectedItems[item.id] }"
                  @click="toggleItem(item)"
                >
                  <div class="item-check">
                    <Icon
                      :icon="selectedItems[item.id] ? 'solar:check-square-bold-duotone' : 'solar:square-line-duotone'"
                      width="20"
                    />
                  </div>
                  <div class="item-info">
                    <div class="item-name">{{ item.productName ?? item.product_name }}</div>
                    <div class="item-meta">{{ item.variantName ?? item.variant_name }}</div>
                  </div>

                  <div v-if="(item.quantity ?? 1) <= 1" class="item-qty-fixed">×1</div>

                  <div v-else-if="selectedItems[item.id]" class="item-qty-ctrl" @click.stop>
                    <v-btn icon size="x-small" variant="text" @click="decrementQty(item.id)">
                      <Icon icon="solar:minus-circle-line-duotone" width="18" />
                    </v-btn>
                    <span>{{ itemQuantities[item.id] }} / {{ item.quantity }}</span>
                    <v-btn icon size="x-small" variant="text" @click="incrementQty(item.id, item.quantity)">
                      <Icon icon="solar:add-circle-line-duotone" width="18" />
                    </v-btn>
                  </div>
                  <div v-else class="item-qty-fixed">×{{ item.quantity }}</div>
                </div>
              </div>

              <div class="section-label">{{ t('returns.new.motifLabel') }}</div>
              <v-select
                v-model="motif"
                :items="motifs"
                :placeholder="t('returns.new.motifPlaceholder')"
                variant="solo-filled"
                flat rounded="xl"
                density="comfortable"
                class="mb-4"
              >
                <template #prepend-inner>
                  <Icon icon="solar:clipboard-list-line-duotone" width="18" />
                </template>
              </v-select>

              <div class="section-label">{{ t('returns.new.resolutionLabel') }}</div>
              <div class="resolution-cards">
                <div
                  v-for="res in resolutions"
                  :key="res.value"
                  class="resolution-card"
                  :class="{ active: resolution === res.value }"
                  @click="resolution = res.value"
                >
                  <Icon :icon="res.icon" width="22" />
                  <span>{{ res.label }}</span>
                </div>
              </div>

              <v-textarea
                v-model="notes"
                :label="t('returns.new.notes')"
                variant="solo-filled"
                flat rounded="xl"
                density="comfortable"
                rows="3"
                class="mb-4"
              >
                <template #prepend-inner>
                  <Icon icon="solar:pen-line-duotone" width="18" />
                </template>
              </v-textarea>

              <v-expand-transition>
                <div v-if="selectedCount > 0" class="refund-summary">
                  <div class="refund-row">
                    <span>{{ t('returns.new.itemsSelected', { count: selectedCount }) }}</span>
                    <span class="refund-amount">{{ estimatedRefund.toFixed(2) }}€</span>
                  </div>
                  <p class="refund-note">{{ t('returns.new.estimateNote') }}</p>
                </div>
              </v-expand-transition>

              <v-expand-transition>
                <div v-if="returnsStore.error" class="error-block">
                  <Icon icon="solar:danger-triangle-line-duotone" width="16" />
                  {{ returnsStore.error }}
                </div>
              </v-expand-transition>

              <v-btn
                block rounded="pill" size="large" color="primary"
                :disabled="!hasSelection"
                :loading="returnsStore.submitting"
                @click="onSubmit"
              >
                {{ t('returns.new.submit') }}
                <Icon icon="solar:arrow-right-line-duotone" width="16" style="margin-left: 6px;" />
              </v-btn>

            </div>
          </div>

          <div v-else key="success" class="success-state">
            <Icon icon="solar:check-circle-bold-duotone" width="48" />
            <h2>{{ t('returns.success.title') }}</h2>
            <p>{{ t('returns.success.subtitle') }}</p>
            <v-btn to="/shop" color="primary" rounded="pill" size="large">
              {{ t('returns.success.backToShop') }}
            </v-btn>
          </div>

        </Transition>

      </div>
    </div>

  </div>
</template>

<style scoped>
.content { padding: 0 24px 40px; }
.returns-wrapper { max-width: 480px; margin: 24px auto; }

.page-header { margin-bottom: 24px; }
.back-link {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12.5px; font-weight: 600; color: rgb(var(--v-theme-on-surface-variant));
  text-decoration: none; margin-bottom: 10px;
}
h1 { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; }

.section-label {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: rgb(var(--v-theme-secondary));
  margin-bottom: 12px; margin-top: 20px;
}
.section-label:first-of-type { margin-top: 0; }

.error-block {
  display: flex; align-items: center; gap: 8px;
  background: rgba(192, 83, 62, 0.1); color: #C0533E;
  border-radius: var(--r-lg); padding: 12px;
  font-size: 12.5px; font-weight: 600; margin-bottom: 12px;
}

.items-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px; }
.return-item-card {
  display: flex; align-items: center; gap: 12px;
  background: rgb(var(--v-theme-surface-variant));
  border: 1.5px solid transparent;
  border-radius: var(--r-lg); padding: 14px;
  cursor: pointer; transition: border-color .2s, transform .15s;
}
.return-item-card:active { transform: scale(0.99); }
.return-item-card.selected { border-color: rgb(var(--v-theme-secondary)); }
.item-check { color: rgb(var(--v-theme-secondary)); flex-shrink: 0; }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 13.5px; font-weight: 600; margin-bottom: 2px; }
.item-meta { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.item-qty-fixed {
  font-size: 12px; font-weight: 700; color: rgb(var(--v-theme-on-surface-variant));
  flex-shrink: 0;
}
.item-qty-ctrl { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.item-qty-ctrl span { font-size: 12px; font-weight: 700; min-width: 32px; text-align: center; }

.resolution-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 8px; }
.resolution-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 16px 8px;
  background: rgb(var(--v-theme-surface-variant));
  border: 1.5px solid transparent;
  border-radius: var(--r-lg); cursor: pointer;
  font-size: 12px; font-weight: 600; text-align: center;
  transition: border-color .2s, color .2s;
}
.resolution-card.active {
  border-color: rgb(var(--v-theme-secondary));
  color: rgb(var(--v-theme-secondary));
}

.refund-summary {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg);
  padding: 14px 16px;
  margin-bottom: 16px;
}
.refund-row {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13px; font-weight: 600; color: rgb(var(--v-theme-on-surface-variant));
}
.refund-amount {
  font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700;
  color: rgb(var(--v-theme-secondary));
}
.refund-note {
  font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 4px;
}

.success-state {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 14px; padding: 48px 0;
  color: #4C7A4C;
}
.success-state h2 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.success-state p { color: rgb(var(--v-theme-on-surface-variant)); font-size: 14px; }

.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>