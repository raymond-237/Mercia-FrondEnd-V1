<script setup lang="ts">
import { useAdminDashboardStore } from '~/stores/Models/dashboard.store'


definePageMeta({ layout: 'admin' })

const store = useAdminDashboardStore()
const period = ref<'monthly' | 'weekly'>('monthly')

onMounted(() => store.fetchSummary(period.value))
watch(period, (val) => store.fetchSummary(val))

const QUICK_ACTIONS = computed(() => [
  { label: 'Ajouter un produit',   icon: 'solar:add-circle-line-duotone',      to: '/backoffice/products/new',              color: 'secondary' },
  { label: 'Commandes en attente', icon: 'solar:clock-circle-line-duotone',    to: '/backoffice/orders?status=pending',     color: 'warning', badge: store.summary?.quickCounts.pendingOrders },
  { label: 'Retours à traiter',    icon: 'solar:undo-left-line-duotone',       to: '/backoffice/returns?status=pending',    color: 'error',   badge: store.summary?.quickCounts.pendingReturns },
  { label: 'Stock faible',         icon: 'solar:danger-triangle-line-duotone', to: '/backoffice/inventory',                  color: 'warning', badge: store.summary?.quickCounts.lowStock },
])

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée',
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[]" />

    <div v-if="store.loading && !store.summary" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="32" />
    </div>

    <template v-else-if="store.summary">

      <!-- Stat cards -->
      <div class="stats-grid">
        <AdminCardStat v-for="stat in store.summary.stats" :key="stat.label" v-bind="stat" />
      </div>

      <!-- Raccourcis -->
      <div class="quick-actions">
        <NuxtLink v-for="action in QUICK_ACTIONS" :key="action.label" :to="action.to" class="quick-action">
          <v-badge v-if="action.badge" :content="action.badge" color="error" offset-x="4" offset-y="4">
            <v-sheet :color="action.color" variant="tonal" rounded="xl" class="quick-icon">
              <Icon :icon="action.icon" width="25" />
            </v-sheet>
          </v-badge>
          <v-sheet v-else :color="action.color" variant="tonal" rounded="xl" class="quick-icon">
            <Icon :icon="action.icon" width="25" />
          </v-sheet>
          <span>{{ action.label }}</span>
        </NuxtLink>
      </div>

      <!-- Analytics row -->
      <div class="analytics-row">

        <div class="panel sales-panel">
          <div class="panel-head">
            <h2>Aperçu des ventes</h2>
            <v-btn-toggle v-model="period" mandatory density="compact" color="secondary" rounded="xl">
              <v-btn value="monthly" size="small">Mensuel</v-btn>
              <v-btn value="weekly" size="small">Hebdo</v-btn>
            </v-btn-toggle>
          </div>
          <LayoutsChartSales :labels="store.summary.salesChart.labels" :values="store.summary.salesChart.values" />
        </div>

        <div class="panel traffic-panel">
          <h2>Répartition par catégorie</h2>
          <div v-if="store.summary.categoryBreakdown.length === 0" class="panel-empty">
            <Icon icon="solar:pie-chart-line-duotone" width="28" />
            <p>Pas encore de ventes à répartir.</p>
          </div>
          <template v-else>
            <LayoutsChartDonut :segments="store.summary.categoryBreakdown" />
            <div class="legend">
              <div v-for="seg in store.summary.categoryBreakdown" :key="seg.label" class="legend-item">
                <span class="legend-dot" :style="{ background: seg.color }" />
                <span class="legend-label">{{ seg.label }}</span>
                <span class="legend-value">{{ seg.value }}%</span>
              </div>
            </div>
          </template>
        </div>

      </div>

      <!-- Deuxième rangée : commandes + activité -->
      <div class="bottom-row">

        <div class="panel orders-panel">
          <div class="panel-head">
            <h2>Commandes récentes</h2>
            <v-btn variant="tonal" color="surface-variant" rounded="lg" size="small" to="/backoffice/orders">
              Tout voir
              <Icon icon="solar:arrow-right-line-duotone" width="14" style="margin-left: 4px;" />
            </v-btn>
          </div>

          <div v-if="store.summary.recentOrders.length === 0" class="panel-empty">
            <Icon icon="solar:bag-4-line-duotone" width="28" />
            <p>Aucune commande pour le moment.</p>
          </div>

          <table v-else class="orders-table">
            <thead>
              <tr><th>Commande</th><th>Client</th><th>Statut</th><th class="text-right">Montant</th></tr>
            </thead>
            <tbody>
              <tr v-for="order in store.summary.recentOrders" :key="order.id" class="order-row" @click="navigateTo(`/backoffice/orders/${order.id}`)">
                <td class="order-id">{{ order.orderNumber }}</td>
                <td>{{ order.customer }}</td>
                <td><span class="status-badge" :class="order.status">{{ STATUS_LABELS[order.status] ?? order.status }}</span></td>
                <td class="text-right amount">{{ order.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="panel activity-panel">
          <h2>Activité récente</h2>

          <div v-if="store.summary.recentActivity.length === 0" class="panel-empty">
            <Icon icon="solar:history-line-duotone" width="28" />
            <p>Aucune activité récente.</p>
          </div>

          <div v-else class="activity-list">
            <div v-for="(item, i) in store.summary.recentActivity" :key="i" class="activity-item">
              <div class="activity-icon"><Icon :icon="item.icon" width="16" /></div>
              <div class="activity-info">
                <div class="activity-text">{{ item.text }}</div>
                <div class="activity-detail">{{ item.detail }}</div>
              </div>
              <div class="activity-time">{{ item.time }}</div>
            </div>
          </div>
        </div>

      </div>

    </template>

  </div>
</template>

<style scoped>
.loading-block { display: flex; justify-content: center; padding: 80px 0; }

.quick-actions {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
  margin-bottom: 24px;
}
.quick-action {
  display: flex; align-items: center; gap: 10px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-lg); padding: 12px;
  text-decoration: none; color: rgb(var(--v-theme-on-surface));
  font-size: 12.5px; font-weight: 700;
  transition: border-color .2s, transform .15s;
}
.quick-action:hover { border-color: rgb(var(--v-theme-secondary)); }
.quick-action:active { transform: scale(0.98); }
.quick-icon { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px; margin-bottom: 24px;
}

.analytics-row, .bottom-row {
  display: grid; grid-template-columns: 2fr 1fr; gap: 18px; margin-bottom: 20px;
}

.panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 22px;
}
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 10px; flex-wrap: wrap; }
.panel h2 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }

.panel-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 28px 0; color: rgb(var(--v-theme-on-surface-variant));
}
.panel-empty p { font-size: 12px; }

.legend { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.legend-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.legend-label { flex: 1; color: rgb(var(--v-theme-on-surface-variant)); font-weight: 600; }
.legend-value { font-weight: 700; }

.orders-table { width: 100%; border-collapse: collapse; }
.orders-table th {
  text-align: left; font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant)); padding: 8px 6px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.order-row { cursor: pointer; }
.order-row:hover { background: rgba(var(--v-theme-secondary), 0.04); }
.orders-table td { padding: 12px 6px; font-size: 12.5px; font-weight: 600; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.orders-table tr:last-child td { border-bottom: none; }
.text-right { text-align: right; }
.order-id { color: rgb(var(--v-theme-secondary)); }
.amount { font-weight: 700; }

.status-badge { display: inline-flex; padding: 3px 10px; border-radius: var(--r-full); font-size: 10.5px; font-weight: 700; }
.status-badge.delivered { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.status-badge.shipped   { background: rgba(198, 138, 82, 0.15); color: #C68A52; }
.status-badge.confirmed { background: rgba(110, 143, 184, 0.15); color: #6E8FB8; }
.status-badge.pending   { background: rgba(217, 164, 65, 0.15); color: #B8862F; }
.status-badge.cancelled { background: rgba(192, 83, 62, 0.12); color: #C0533E; }

.activity-list { display: flex; flex-direction: column; gap: 14px; }
.activity-item { display: flex; align-items: flex-start; gap: 10px; }
.activity-icon {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: rgb(var(--v-theme-surface-variant)); color: rgb(var(--v-theme-secondary));
  display: flex; align-items: center; justify-content: center;
}
.activity-info { flex: 1; min-width: 0; }
.activity-text { font-size: 12.5px; font-weight: 700; }
.activity-detail { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); }
.activity-time { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); flex-shrink: 0; white-space: nowrap; }

@media (min-width: 640px) {
  .quick-actions { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 960px) {
  .analytics-row, .bottom-row { grid-template-columns: 1fr; }
}
</style>