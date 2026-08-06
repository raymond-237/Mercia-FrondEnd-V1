<script setup lang="ts">
import useAnalyticsService from '~/services/Models/analytic.service'
import type { AnalyticsSummary, CategoryProfit, PaymentMethodAmount } from '~/services/Models/analytics.service'

definePageMeta({ layout: 'admin' })

const analyticsService = useAnalyticsService()

const PAYMENT_META: Record<string, { label: string; icon: string }> = {
  paypal:         { label: 'PayPal',            icon: 'solar:card-line-duotone' },
  bank_transfer:  { label: 'Virement bancaire', icon: 'solar:banknote-2-line-duotone' },
  cash:           { label: 'Espèces',           icon: 'solar:wallet-money-line-duotone' },
}

// ── Période — presets rapides + plage custom

type PeriodPreset = '7d' | '30d' | '90d' | 'custom'
const preset = ref<PeriodPreset>('30d')
const customFrom = ref('')
const customTo   = ref('')

const PRESET_LABELS: Record<PeriodPreset, string> = {
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  '90d': '90 derniers jours',
  custom: 'Période personnalisée',
}

const { from, to } = (() => {
  return {
    from: computed(() => {
      if (preset.value === 'custom') return customFrom.value
      const days = preset.value === '7d' ? 7 : preset.value === '30d' ? 30 : 90
      const d = new Date()
      d.setDate(d.getDate() - days)
      return d.toISOString().slice(0, 10)
    }),
    to: computed(() => {
      if (preset.value === 'custom') return customTo.value
      return new Date().toISOString().slice(0, 10)
    }),
  }
})()

// ── Chargement

const loading    = ref(false)
const summary    = ref<AnalyticsSummary | null>(null)
const categories = ref<CategoryProfit[]>([])
const paymentReceived = ref<PaymentMethodAmount[]>([])
const paymentPending  = ref<PaymentMethodAmount[]>([])

async function load() {
  if (!from.value || !to.value) return
  loading.value = true
  try {
    const [profitData, paymentData] = await Promise.all([
      analyticsService.profitByCategory(from.value, to.value),
      analyticsService.paymentBreakdown(from.value, to.value),
    ])
    summary.value    = profitData.summary
    categories.value = profitData.categories
    paymentReceived.value = paymentData.received
    paymentPending.value  = paymentData.pending
  } catch (e) {
    console.error('Erreur chargement analytics:', e)
    summary.value    = null
    categories.value = []
    paymentReceived.value = []
    paymentPending.value  = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch([from, to], load)

// ── Regroupement par catégorie parente pour l'affichage

const groupedByParent = computed(() => {
  const groups = new Map<string, { parentName: string; children: CategoryProfit[]; totalRevenue: number; totalProfit: number }>()

  for (const cat of categories.value) {
    const key = cat.parentId ?? cat.categoryId
    const label = cat.parentName ?? cat.categoryName

    if (!groups.has(key)) {
      groups.set(key, { parentName: label, children: [], totalRevenue: 0, totalProfit: 0 })
    }

    const group = groups.get(key)!
    group.children.push(cat)
    group.totalRevenue += cat.revenue
    group.totalProfit  += cat.profit
  }

  return Array.from(groups.values()).sort((a, b) => b.totalProfit - a.totalProfit)
})

function marginColor(margin: number): string {
  if (margin >= 40) return 'success'
  if (margin >= 20) return 'warning'
  return 'error'
}
</script>

<template>
  <div>
    <UiBreadCrumbs :items="[{ label: 'Analytics', icon: 'solar:chart-2-line-duotone' }]" />

    <!-- Sélecteur de période -->
    <div class="period-bar">
      <v-btn
        v-for="p in (['7d', '30d', '90d', 'custom'] as PeriodPreset[])" :key="p"
        :variant="preset === p ? 'flat' : 'tonal'"
        :color="preset === p ? 'secondary' : undefined"
        rounded="xl" size="small"
        @click="preset = p"
      >
        {{ PRESET_LABELS[p] }}
      </v-btn>

      <template v-if="preset === 'custom'">
        <v-text-field
          v-model="customFrom" type="date" density="compact" variant="solo-filled" flat rounded="xl" hide-details
          style="max-width: 160px;"
        />
        <span class="period-sep">→</span>
        <v-text-field
          v-model="customTo" type="date" density="compact" variant="solo-filled" flat rounded="xl" hide-details
          style="max-width: 160px;"
        />
      </template>
    </div>

    <div v-if="loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <template v-else>
      <!-- Résumé -->
      <div v-if="summary" class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Chiffre d'affaires</div>
          <div class="summary-value">{{ summary.revenue.toFixed(2) }}€</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Coût total</div>
          <div class="summary-value muted">{{ summary.cost.toFixed(2) }}€</div>
        </div>
        <div class="summary-card highlight">
          <div class="summary-label">Bénéfice net</div>
          <div class="summary-value">{{ summary.profit.toFixed(2) }}€</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Marge</div>
          <div class="summary-value">
            <v-chip size="small" :color="marginColor(summary.marginPercent)" variant="tonal">
              {{ summary.marginPercent }}%
            </v-chip>
          </div>
        </div>
      </div>

      <!-- Moyens de paiement — reçu vs en attente -->
      <div v-if="paymentReceived.length" class="panel payment-panel">
        <h2>Moyens de paiement</h2>
        <div class="payment-grid">
          <div v-for="p in paymentReceived" :key="p.method" class="payment-card">
            <div class="payment-card-icon">
              <Icon :icon="PAYMENT_META[p.method]?.icon ?? 'solar:card-line-duotone'" width="20" />
            </div>
            <div class="payment-card-info">
              <div class="payment-card-label">{{ PAYMENT_META[p.method]?.label ?? p.method }}</div>
              <div class="payment-card-count">{{ p.ordersCount }} commande{{ p.ordersCount > 1 ? 's' : '' }}</div>
            </div>
            <div class="payment-card-amount">{{ p.amount.toFixed(2) }}€</div>
          </div>
        </div>

        <template v-if="paymentPending.length">
          <div class="pending-divider">
            <Icon icon="solar:clock-circle-line-duotone" width="14" />
            <span>En attente — pas encore confirmé reçu</span>
          </div>
          <div class="payment-grid pending">
            <div v-for="p in paymentPending" :key="p.method" class="payment-card pending">
              <div class="payment-card-icon"><Icon :icon="PAYMENT_META[p.method]?.icon ?? 'solar:card-line-duotone'" width="20" /></div>
              <div class="payment-card-info">
                <div class="payment-card-label">{{ PAYMENT_META[p.method]?.label ?? p.method }}</div>
                <div class="payment-card-count">{{ p.ordersCount }} commande{{ p.ordersCount > 1 ? 's' : '' }}</div>
              </div>
              <div class="payment-card-amount muted">{{ p.amount.toFixed(2) }}€</div>
            </div>
          </div>
        </template>
      </div>

      <!-- Bénéfice par catégorie, groupé par parent -->
      <div v-if="!categories.length" class="empty-block">
        <Icon icon="solar:chart-square-line-duotone" width="36" />
        <p>Aucune vente sur cette période.</p>
      </div>

      <div v-else class="category-groups">
        <div v-for="group in groupedByParent" :key="group.parentName" class="panel">
          <div class="group-head">
            <h2>{{ group.parentName }}</h2>
            <div class="group-totals">
              <span>{{ group.totalRevenue.toFixed(2) }}€ CA</span>
              <span class="group-profit">{{ group.totalProfit.toFixed(2) }}€ bénéfice</span>
            </div>
          </div>

          <table class="category-table">
            <thead>
              <tr>
                <th>Sous-catégorie</th>
                <th class="text-right">Unités</th>
                <th class="text-right">CA</th>
                <th class="text-right">Coût</th>
                <th class="text-right">Bénéfice</th>
                <th class="text-right">Marge</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in group.children" :key="cat.categoryId">
                <td class="cat-name">{{ cat.categoryName }}</td>
                <td class="text-right">{{ cat.unitsSold }}</td>
                <td class="text-right">{{ cat.revenue.toFixed(2) }}€</td>
                <td class="text-right muted">{{ cat.cost.toFixed(2) }}€</td>
                <td class="text-right profit-cell">{{ cat.profit.toFixed(2) }}€</td>
                <td class="text-right">
                  <v-chip size="x-small" :color="marginColor(cat.marginPercent)" variant="tonal">
                    {{ cat.marginPercent }}%
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.period-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.period-sep { color: rgb(var(--v-theme-on-surface-variant)); font-size: 13px; }

.loading-block, .empty-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: rgb(var(--v-theme-on-surface-variant));
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
@media (min-width: 720px) {
  .summary-grid { grid-template-columns: repeat(4, 1fr); }
}

.summary-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl);
  padding: 16px;
}
.summary-card.highlight {
  background: rgba(var(--v-theme-secondary), 0.06);
  border-color: rgba(var(--v-theme-secondary), 0.2);
}
.summary-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 6px;
}
.summary-value {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 700;
}
.summary-value.muted { color: rgb(var(--v-theme-on-surface-variant)); }

.category-groups { display: flex; flex-direction: column; gap: 16px; }

.payment-panel { margin-bottom: 16px; }
.payment-panel h2 {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
}
.payment-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 640px) {
  .payment-grid { grid-template-columns: repeat(3, 1fr); }
}
.payment-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg);
  padding: 12px 14px;
}
.payment-card.pending { opacity: 0.75; }
.payment-card-icon {
  width: 34px; height: 34px; border-radius: var(--r-md); flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary));
}
.payment-card-info { flex: 1; min-width: 0; }
.payment-card-label { font-size: 12.5px; font-weight: 700; }
.payment-card-count { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); }
.payment-card-amount { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 700; color: rgb(var(--v-theme-secondary)); }
.payment-card-amount.muted { color: rgb(var(--v-theme-on-surface-variant)); }

.pending-divider {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 14px 0 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl);
  padding: 20px;
}

.group-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 8px;
}
.group-head h2 {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  font-weight: 700;
}
.group-totals {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}
.group-profit { font-weight: 700; color: rgb(var(--v-theme-secondary)); }

.category-table { width: 100%; border-collapse: collapse; }
.category-table th {
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(var(--v-theme-on-surface-variant));
  padding: 8px 6px;
  border-bottom: 1.5px solid rgba(var(--v-theme-on-surface), 0.08);
}
.category-table td {
  padding: 10px 6px;
  font-size: 12.5px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}
.category-table .text-right { text-align: right; }
.cat-name { font-weight: 700; }
.muted { color: rgb(var(--v-theme-on-surface-variant)); }
.profit-cell { font-weight: 700; color: rgb(var(--v-theme-secondary)); }
</style>