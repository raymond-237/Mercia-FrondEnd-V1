<script setup lang="ts">
import { useAdminInventoryStore } from '~/stores/Models/inventory.store'
import type { InventoryDetail } from '~/types/Models/inventory.type'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const store = useAdminInventoryStore()

const FALLBACK_INVENTORY: InventoryDetail = {
  id: 'fb-1', quantity: 24, lowStockThreshold: 5,
  createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-07-10T00:00:00Z',
  productVariant: { id: 'v1', sku: 'AE-EBE-22', name: '22 pouces', productName: 'Ébène Lisse Frontal', productId: 'p1' },
  movements: [
    { id: 'm1', type: 'in', quantity: 20, reason: 'Réception fournisseur initiale', createdAt: '2026-03-01T09:00:00Z' },
    { id: 'm2', type: 'out', quantity: -5, reason: 'Commande confirmée', createdAt: '2026-05-14T10:00:00Z' },
    { id: 'm3', type: 'in', quantity: 10, reason: 'Réapprovisionnement manuel', createdAt: '2026-06-20T14:00:00Z' },
    { id: 'm4', type: 'adjustment', quantity: -1, reason: 'Correction après inventaire physique', createdAt: '2026-07-10T08:00:00Z' },
  ],
}

const inventory      = ref<InventoryDetail>(FALLBACK_INVENTORY)
const loading         = ref(true)
const usingFallback   = ref(false)

const loadInventory = async () => {
  const data = await store.fetchInventoryDetail(route.params.id as string)
  if (data) {
    inventory.value    = data
    usingFallback.value = false
  } else {
    inventory.value     = FALLBACK_INVENTORY
    usingFallback.value = true
  }
  loading.value = false
}
onMounted(loadInventory)

function stockStatus(inv: InventoryDetail): { label: string; class: 'ok' | 'low' | 'out' } {
  if (inv.quantity <= 0) return { label: 'Rupture', class: 'out' }
  if (inv.quantity <= inv.lowStockThreshold) return { label: 'Stock faible', class: 'low' }
  return { label: 'En stock', class: 'ok' }
}

const MOVEMENT_LABELS: Record<string, string> = {
  in: 'Entrée', out: 'Sortie', adjustment: 'Ajustement',
}
const MOVEMENT_ICONS: Record<string, string> = {
  in: 'solar:arrow-down-line-duotone', out: 'solar:arrow-up-line-duotone', adjustment: 'solar:pen-line-duotone',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Action rapide
const actionDialog   = ref(false)
const actionType      = ref<'add' | 'remove' | 'adjust'>('add')
const actionQuantity  = ref<number | null>(null)
const actionReason    = ref('')

function openAction(type: 'add' | 'remove' | 'adjust') {
  actionType.value     = type
  actionQuantity.value = type === 'adjust' ? inventory.value.quantity : null
  actionReason.value   = ''
  actionDialog.value   = true
}

const actionLabels = {
  add: 'Ajouter du stock',
  remove: 'Retirer du stock',
  adjust: 'Ajuster la quantité',
}

async function confirmAction() {
  if (actionQuantity.value === null) return

  let success = false
  if (actionType.value === 'add') {
    success = await store.addStock(inventory.value.id, actionQuantity.value, actionReason.value || undefined)
  } else if (actionType.value === 'remove') {
    success = await store.removeStock(inventory.value.id, actionQuantity.value, actionReason.value || undefined)
  } else {
    success = await store.adjust(inventory.value.id, actionQuantity.value, actionReason.value || undefined)
  }

  if (success && store.currentInventory) {
    inventory.value = store.currentInventory
    notify('Stock mis à jour avec succès.', 'success')
    actionDialog.value = false
  } else {
    notify('Une erreur est survenue — vérifie la quantité disponible.', 'error')
  }
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[
      { label: 'Inventaire', icon: 'solar:pallete-2-line-duotone', to: '/backoffice/inventory' },
      { label: loading ? '...' : (inventory.productVariant?.productName ?? 'Détail') },
    ]" />

    <div v-if="usingFallback" class="fallback-banner">
      <Icon icon="solar:info-circle-line-duotone" width="16" />
      Inventaire introuvable ou API indisponible — aperçu avec des données d'exemple.
    </div>

    <div v-if="loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <template v-else>

      <!-- En-tête produit + stats -->
      <div class="panel header-panel">
        <div class="header-top">
          <div>
            <div class="product-title">{{ inventory.productVariant?.productName ?? 'Produit' }}</div>
            <div class="muted">{{ inventory.productVariant?.name }} · SKU {{ inventory.productVariant?.sku ?? '—' }}</div>
          </div>
          <span class="stock-badge" :class="stockStatus(inventory).class">{{ stockStatus(inventory).label }}</span>
        </div>

        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-value">{{ inventory.quantity }}</div>
            <div class="stat-label">En stock</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ inventory.lowStockThreshold }}</div>
            <div class="stat-label">Seuil alerte</div>
          </div>
        </div>

        <div class="header-actions">
          <v-btn variant="elevated" color="secondary" rounded="xl" @click="openAction('add')">
            <Icon icon="solar:add-circle-line-duotone" width="16" style="margin-right: 6px;" />
            Ajouter
          </v-btn>
          <v-btn variant="tonal" color="error" rounded="xl" :disabled="inventory.quantity <= 0" @click="openAction('remove')">
            <Icon icon="solar:minus-circle-line-duotone" width="16" style="margin-right: 6px;" />
            Retirer
          </v-btn>
          <v-btn variant="tonal" color="primary" rounded="xl" @click="openAction('adjust')">
            <Icon icon="solar:pen-line-duotone" width="16" style="margin-right: 6px;" />
            Ajuster
          </v-btn>
        </div>
      </div>

      <!-- Historique des mouvements -->
      <div class="panel">
        <h2>Historique des mouvements</h2>

        <div v-if="!inventory.movements?.length" class="empty-movements">
          <Icon icon="solar:clock-circle-line-duotone" width="28" />
          <p>Aucun mouvement enregistré.</p>
        </div>

        <div v-else class="movements-list">
          <div v-for="m in inventory.movements" :key="m.id" class="movement-row">
            <div class="movement-icon" :class="m.type">
              <Icon :icon="MOVEMENT_ICONS[m.type]" width="16" />
            </div>
            <div class="movement-info">
              <div class="movement-top">
                <span class="movement-type">{{ MOVEMENT_LABELS[m.type] }}</span>
                <span class="movement-qty" :class="{ negative: m.quantity < 0 }">
                  {{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}
                </span>
              </div>
              <div v-if="m.reason" class="muted">{{ m.reason }}</div>
              <div class="movement-date">{{ formatDate(m.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- Dialog action rapide -->
    <v-dialog v-model="actionDialog" max-width="380">
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="text-body-1 font-weight-bold">{{ actionLabels[actionType] }}</v-card-title>
        <v-card-text>
          <div v-if="actionType !== 'adjust'" class="muted mb-3">Stock actuel : {{ inventory.quantity }}</div>

          <v-text-field
            v-model.number="actionQuantity"
            :label="actionType === 'adjust' ? 'Nouvelle quantité exacte' : 'Quantité'"
            type="number" min="0"
            variant="solo-filled" flat rounded="xl" density="comfortable" hide-details class="mb-3"
          />
          <v-text-field
            v-model="actionReason"
            label="Motif (optionnel)"
            variant="solo-filled" flat rounded="xl" density="comfortable" hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="actionDialog = false">Annuler</v-btn>
          <v-btn
            color="secondary" variant="flat" rounded="xl"
            :loading="store.actionLoading" :disabled="actionQuantity === null" @click="confirmAction"
          >
            Confirmer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<style scoped>
.fallback-banner {
  display: flex; align-items: center; gap: 8px;
  background: rgba(var(--v-theme-secondary), 0.08); color: rgb(var(--v-theme-secondary));
  border-radius: var(--r-lg); padding: 10px 14px; font-size: 12px; font-weight: 600;
  margin-bottom: 14px;
}

.loading-block { display: flex; justify-content: center; padding: 48px 0; }

.panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 20px; margin-bottom: 16px;
}
.panel h2 { font-size: 14px; font-weight: 700; margin-bottom: 14px; }

.header-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.product-title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; }
.muted { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }

.stats-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
.stat-card {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg); padding: 14px; text-align: center;
}
.stat-value { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; }
.stat-label { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); font-weight: 600; margin-top: 2px; }

.header-actions { display: flex; gap: 10px; flex-wrap: wrap; padding-top: 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); }

.stock-badge { display: inline-flex; padding: 4px 12px; border-radius: var(--r-full); font-size: 11px; font-weight: 700; flex-shrink: 0; }
.stock-badge.ok  { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.stock-badge.low { background: rgba(217, 164, 65, 0.15); color: #B8862F; }
.stock-badge.out { background: rgba(192, 83, 62, 0.12); color: #C0533E; }

.empty-movements { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 0; color: rgb(var(--v-theme-on-surface-variant)); }

.movements-list { display: flex; flex-direction: column; gap: 4px; }
.movement-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.movement-row:last-child { border-bottom: none; }

.movement-icon {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.movement-icon.in         { background: rgba(76, 122, 76, 0.12);   color: #4C7A4C; }
.movement-icon.out        { background: rgba(192, 83, 62, 0.12);   color: #C0533E; }
.movement-icon.adjustment { background: rgba(110, 143, 184, 0.15); color: #6E8FB8; }

.movement-info { flex: 1; }
.movement-top { display: flex; align-items: center; justify-content: space-between; }
.movement-type { font-size: 13px; font-weight: 700; }
.movement-qty { font-size: 13px; font-weight: 700; color: #4C7A4C; }
.movement-qty.negative { color: #C0533E; }
.movement-date { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 4px; }
</style>