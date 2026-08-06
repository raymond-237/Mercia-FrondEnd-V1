<script setup lang="ts">
import { useAdminCustomersStore } from '~/stores/Models/customersAdmin.store'
import type { CustomerDetail } from '~/types/Models/customer.type'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const store = useAdminCustomersStore()

// ── Aucune donnée statique : chargement réel uniquement.

const customer = ref<CustomerDetail | null>(null)
const loading   = ref(true)
const notFound  = ref(false)

onMounted(async () => {
  const data = await store.fetchCustomerDetail(route.params.id as string)

  if (!data) {
    notFound.value = true
  } else {
    customer.value = data
  }

  loading.value = false
})

const AVATAR_RAMPS = ['secondary', 'info', 'success', 'warning', 'error'] as const
function avatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_RAMPS[Math.abs(hash) % AVATAR_RAMPS.length]
}
function initials(c: CustomerDetail) {
  const fi = c.firstName?.[0] ?? c.email?.[0] ?? '?'
  const li = c.lastName?.[0] ?? ''
  return `${fi}${li}`.toUpperCase()
}
function displayName(c: CustomerDetail) {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ')
  return name || c.email
}

function formatDate(iso: string | null, withTime = false) {
  if (!iso) return 'Jamais commandé'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

const averageOrderValue = computed(() => {
  if (!customer.value?.ordersCount) return 0
  return customer.value.totalSpent / customer.value.ordersCount
})

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif', inactive: 'Inactif', suspended: 'Suspendu',
}
const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée',
}

function isVip(c: CustomerDetail) {
  return c.totalSpent >= 800
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[
      { label: 'Clients', icon: 'solar:users-group-rounded-line-duotone', to: '/backoffice/customers' },
      { label: loading || !customer ? '...' : displayName(customer) },
    ]" />

    <!-- Chargement -->
    <div v-if="loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <!-- Introuvable -->
    <div v-else-if="notFound || !customer" class="not-found-block">
      <Icon icon="solar:user-cross-rounded-line-duotone" width="40" />
      <p>Client introuvable.</p>
      <v-btn variant="tonal" rounded="xl" to="/backoffice/customers">Retour aux clients</v-btn>
    </div>

    <template v-else>

      <!-- En-tête profil -->
      <div class="profile-header">
        <div class="avatar avatar-xl" :class="`bg-${avatarColor(customer.id)}`">{{ initials(customer) }}</div>

        <div class="profile-identity">
          <div class="profile-name">
            {{ displayName(customer) }}
            <span v-if="isVip(customer)" class="vip-pill">
              <Icon icon="solar:crown-bold-duotone" width="12" />
              VIP
            </span>
          </div>
          <div class="profile-sub">Client depuis {{ formatDate(customer.createdAt) }}</div>
        </div>

        <span class="status-badge" :class="customer.status">{{ STATUS_LABELS[customer.status] ?? customer.status }}</span>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><Icon icon="solar:bag-4-bold-duotone" width="20" /></div>
          <div>
            <div class="stat-value">{{ customer.ordersCount }}</div>
            <div class="stat-label">Commandes</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><Icon icon="solar:wallet-money-bold-duotone" width="20" /></div>
          <div>
            <div class="stat-value">{{ customer.totalSpent.toFixed(2) }}€</div>
            <div class="stat-label">Total dépensé</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><Icon icon="solar:chart-square-bold-duotone" width="20" /></div>
          <div>
            <div class="stat-value">{{ averageOrderValue.toFixed(2) }}€</div>
            <div class="stat-label">Panier moyen</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"><Icon icon="solar:clock-circle-bold-duotone" width="20" /></div>
          <div>
            <div class="stat-value stat-value-sm">{{ formatDate(customer.lastOrderAt) }}</div>
            <div class="stat-label">Dernière commande</div>
          </div>
        </div>
      </div>

      <div class="detail-grid">

        <!-- Historique commandes -->
        <div class="panel main-col">
          <h2>Commandes récentes</h2>

          <div v-if="!customer.recentOrders?.length" class="empty-orders">
            <Icon icon="solar:bag-cross-line-duotone" width="28" />
            <p>Aucune commande pour ce client.</p>
          </div>

          <div v-else class="orders-list">
            <NuxtLink
              v-for="o in customer.recentOrders" :key="o.id"
              :to="`/backoffice/orders/${o.id}`" class="order-row"
            >
              <div>
                <div class="order-number">{{ o.orderNumber }}</div>
                <div class="muted">{{ formatDate(o.createdAt, true) }}</div>
              </div>
              <div class="order-right">
                <span class="order-status" :class="o.status">{{ ORDER_STATUS_LABELS[o.status] ?? o.status }}</span>
                <div class="order-amount">{{ o.total.toFixed(2) }}€</div>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Coordonnées -->
        <div class="panel side-col">
          <h2>Coordonnées</h2>
          <div class="info-row">
            <Icon icon="solar:letter-line-duotone" width="16" />
            {{ customer.email }}
          </div>
          <div class="info-row">
            <Icon icon="solar:phone-line-duotone" width="16" />
            {{ customer.phone ?? 'Non renseigné' }}
          </div>
        </div>

      </div>

    </template>

  </div>
</template>

<style scoped>
.loading-block,
.not-found-block {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 60px 0; color: rgb(var(--v-theme-on-surface-variant));
}

.avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #FAFAF8;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.avatar-xl { width: 64px; height: 64px; font-size: 20px; }

.bg-secondary { background: rgb(var(--v-theme-secondary)); }
.bg-info      { background: #6E8FB8; }
.bg-success   { background: #4C7A4C; }
.bg-warning   { background: #B8862F; }
.bg-error     { background: #C0533E; }

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl);
  padding: 20px;
  margin-bottom: 16px;
}
.profile-identity { flex: 1; min-width: 0; }
.profile-name {
  font-family: 'Fraunces', serif;
  font-size: 19px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.profile-sub { font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }

.vip-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(184, 134, 47, 0.12);
  color: #B8862F;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 3px 9px;
  border-radius: var(--r-full);
}

.status-badge {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: var(--r-full);
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.status-badge.active    { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.status-badge.inactive  { background: rgba(var(--v-theme-on-surface), 0.08); color: rgb(var(--v-theme-on-surface-variant)); }
.status-badge.suspended { background: rgba(192, 83, 62, 0.12); color: #C0533E; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-lg);
  padding: 14px;
}
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--r-lg);
  background: rgba(var(--v-theme-secondary), 0.1);
  color: rgb(var(--v-theme-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-value { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; line-height: 1.1; }
.stat-value-sm { font-size: 13px; font-family: inherit; font-weight: 700; }
.stat-label { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); font-weight: 600; margin-top: 2px; }

.panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl);
  padding: 20px;
}
.panel h2 { font-size: 14px; font-weight: 700; margin-bottom: 14px; }

.detail-grid { display: flex; flex-direction: column; gap: 16px; }

.empty-orders {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
  color: rgb(var(--v-theme-on-surface-variant));
}

.orders-list { display: flex; flex-direction: column; gap: 8px; }
.order-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: var(--r-lg);
  background: rgb(var(--v-theme-surface-variant));
  text-decoration: none;
  color: inherit;
  transition: background 0.2s;
}
.order-row:hover { background: rgba(var(--v-theme-secondary), 0.08); }
.order-number { font-size: 13px; font-weight: 700; }
.muted { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); }
.order-right { display: flex; align-items: center; gap: 10px; }
.order-amount { font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-secondary)); }

.order-status { display: inline-flex; padding: 3px 10px; border-radius: var(--r-full); font-size: 10px; font-weight: 700; }
.order-status.pending   { background: rgba(217, 164, 65, 0.15); color: #B8862F; }
.order-status.confirmed { background: rgba(198, 138, 82, 0.15); color: #C68A52; }
.order-status.shipped   { background: rgba(110, 143, 184, 0.15); color: #6E8FB8; }
.order-status.delivered { background: rgba(76, 122, 76, 0.12);  color: #4C7A4C; }
.order-status.cancelled { background: rgba(192, 83, 62, 0.12);  color: #C0533E; }

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 600;
  margin-bottom: 10px;
}
.info-row:last-child { margin-bottom: 0; }

@media (min-width: 960px) {
  .stats-grid { grid-template-columns: repeat(4, 1fr); }
  .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }
}
</style>