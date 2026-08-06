<script setup lang="ts">
import { useAdminReturnRequestsStore } from '~/stores/Models/returnrequest.store'
import type { ReturnRequestDetail, ReturnStatus, ReturnResolution } from '~/types/Models/returnRequest.type'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const store = useAdminReturnRequestsStore()

const FALLBACK_RETURN: ReturnRequestDetail = {
  id: 'fb-1', status: 'pending', reason: 'Taille ne convient pas', notes: null,
  createdAt: '2026-07-12T10:00:00Z', itemsCount: 1,
  order: { id: 'o1', orderNumber: 'AE-2026-000123', total: 634.90 },
  user: { id: 'u1', firstName: 'Marie', lastName: 'Dubois', email: 'marie.dubois@example.com' },
  items: [
    { id: 'ri1', orderItemId: 'i1', quantity: 1, condition: 'Neuf, jamais porté', resolution: 'refund', productName: 'Ébène Lisse Frontal', variantName: '22 pouces' },
  ],
}

const returnRequest = ref<ReturnRequestDetail>(FALLBACK_RETURN)
const loading        = ref(true)
const usingFallback   = ref(false)

const loadReturn = async () => {
  const data = await store.fetchReturnDetail(route.params.id as string)
  if (data) {
    returnRequest.value = data
    usingFallback.value = false
  } else {
    returnRequest.value = FALLBACK_RETURN
    usingFallback.value = true
  }
  loading.value = false
}
onMounted(loadReturn)

const STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: 'En attente', approved: 'Approuvée', rejected: 'Rejetée', completed: 'Complétée',
}
const RESOLUTION_LABELS: Record<ReturnResolution, string> = {
  refund: 'Remboursement', exchange: 'Échange', store_credit: 'Avoir',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Approbation
const approveDialog  = ref(false)
const restoreStock   = ref(true)
async function onApprove() {
  const success = await store.approveReturn(returnRequest.value.id, restoreStock.value)
  if (success && store.currentReturn) returnRequest.value = store.currentReturn
  approveDialog.value = false
  notify(success ? 'Demande approuvée avec succès.' : 'Une erreur est survenue.', success ? 'success' : 'error')
}

// ── Rejet
const rejectDialog = ref(false)
const rejectReason  = ref('')
async function onReject() {
  const success = await store.rejectReturn(returnRequest.value.id, rejectReason.value || undefined)
  if (success && store.currentReturn) returnRequest.value = store.currentReturn
  rejectDialog.value = false
  rejectReason.value = ''
  notify(success ? 'Demande rejetée.' : 'Une erreur est survenue.', success ? 'success' : 'error')
}

// ── Complétion
async function onComplete() {
  const success = await store.completeReturn(returnRequest.value.id)
  if (success && store.currentReturn) returnRequest.value = store.currentReturn
  notify(success ? 'Retour marqué comme complété.' : 'Une erreur est survenue.', success ? 'success' : 'error')
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[
      { label: 'Retours', icon: 'solar:map-arrow-left-line-duotone', to: '/backoffice/returns' },
      { label: loading ? '...' : (returnRequest.order?.orderNumber ?? 'Détail') },
    ]" />

    <div v-if="usingFallback" class="fallback-banner">
      <Icon icon="solar:info-circle-line-duotone" width="16" />
      Demande introuvable ou API indisponible — aperçu avec des données d'exemple.
    </div>

    <div v-if="loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <template v-else>

      <!-- En-tête statut + actions -->
      <div class="panel status-panel">
        <div class="status-top">
          <span class="status-badge-lg" :class="returnRequest.status">
            {{ STATUS_LABELS[returnRequest.status] }}
          </span>
          <div class="muted">Demandée le {{ formatDate(returnRequest.createdAt) }}</div>
        </div>

        <div v-if="returnRequest.status === 'pending'" class="status-actions">
          <v-btn color="secondary" variant="flat" rounded="xl" @click="approveDialog = true">
            <Icon icon="solar:check-circle-line-duotone" width="16" style="margin-right: 6px;" />
            Approuver
          </v-btn>
          <v-btn variant="tonal" color="error" rounded="xl" @click="rejectDialog = true">
            <Icon icon="solar:close-circle-line-duotone" width="16" style="margin-right: 6px;" />
            Rejeter
          </v-btn>
        </div>

        <div v-else-if="returnRequest.status === 'approved'" class="status-actions">
          <v-btn color="secondary" variant="flat" rounded="xl" :loading="store.actionLoading" @click="onComplete">
            <Icon icon="solar:box-line-duotone" width="16" style="margin-right: 6px;" />
            Marquer comme complétée
          </v-btn>
        </div>
      </div>

      <div class="detail-grid">

        <!-- Colonne principale -->
        <div class="main-col">

          <div class="panel">
            <h2>Motif du retour</h2>
            <p class="reason-text">{{ returnRequest.reason }}</p>
            <template v-if="returnRequest.notes">
              <h2 class="mt-4">Notes</h2>
              <p class="reason-text notes-text">{{ returnRequest.notes }}</p>
            </template>
          </div>

          <div class="panel">
            <h2>Articles concernés</h2>
            <div class="items-list">
              <div v-for="item in returnRequest.items" :key="item.id" class="item-row">
                <div class="item-info">
                  <div class="item-name">{{ item.productName ?? 'Article' }}</div>
                  <div class="muted">{{ item.variantName }} · Qté {{ item.quantity }}</div>
                  <div v-if="item.condition" class="item-condition">{{ item.condition }}</div>
                </div>
                <span class="resolution-badge" :class="item.resolution">
                  {{ RESOLUTION_LABELS[item.resolution] }}
                </span>
              </div>
            </div>
          </div>

        </div>

        <!-- Colonne latérale -->
        <div class="side-col">

          <div class="panel">
            <h2>Client</h2>
            <div v-if="returnRequest.user" class="info-row">
              <Icon icon="solar:user-line-duotone" width="16" />
              {{ returnRequest.user.firstName }} {{ returnRequest.user.lastName }}
            </div>
            <div v-if="returnRequest.user" class="info-row">
              <Icon icon="solar:letter-line-duotone" width="16" />
              {{ returnRequest.user.email }}
            </div>
          </div>

          <div v-if="returnRequest.order" class="panel">
            <h2>Commande liée</h2>
            <NuxtLink :to="`/backoffice/orders/${returnRequest.order.id}`" class="order-link">
              <div class="info-row">
                <Icon icon="solar:bag-4-line-duotone" width="16" />
                {{ returnRequest.order.orderNumber }}
              </div>
              <div class="order-total">{{ returnRequest.order.total.toFixed(2) }}€</div>
            </NuxtLink>
          </div>

        </div>

      </div>

    </template>

    <!-- Dialog approbation -->
    <v-dialog v-model="approveDialog" max-width="380">
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="text-body-1 font-weight-bold">Approuver ce retour ?</v-card-title>
        <v-card-text>
          <v-checkbox
            v-model="restoreStock"
            label="Restaurer le stock des articles retournés"
            density="comfortable"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="approveDialog = false">Annuler</v-btn>
          <v-btn color="secondary" variant="flat" rounded="xl" :loading="store.actionLoading" @click="onApprove">
            Confirmer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog rejet -->
    <v-dialog v-model="rejectDialog" max-width="380">
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="text-body-1 font-weight-bold">Rejeter cette demande ?</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="rejectReason"
            label="Motif du rejet (optionnel)"
            rows="2"
            variant="solo-filled" flat rounded="xl" density="comfortable" hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="rejectDialog = false">Retour</v-btn>
          <v-btn color="error" variant="flat" rounded="xl" :loading="store.actionLoading" @click="onReject">
            Confirmer le rejet
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
.panel h2 { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
.panel h2.mt-4 { margin-top: 18px; }

.status-panel { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
.status-top { display: flex; flex-direction: column; gap: 6px; }
.status-actions { display: flex; gap: 10px; flex-wrap: wrap; }

.status-badge-lg { display: inline-flex; padding: 5px 14px; border-radius: var(--r-full); font-size: 12px; font-weight: 700; width: fit-content; }
.status-badge-lg.pending   { background: rgba(217, 164, 65, 0.15); color: #B8862F; }
.status-badge-lg.approved  { background: rgba(110, 143, 184, 0.15); color: #6E8FB8; }
.status-badge-lg.completed { background: rgba(76, 122, 76, 0.12);  color: #4C7A4C; }
.status-badge-lg.rejected  { background: rgba(192, 83, 62, 0.12);  color: #C0533E; }

.detail-grid { display: flex; flex-direction: column; gap: 0; }
.main-col, .side-col { display: flex; flex-direction: column; }

.reason-text { font-size: 13px; line-height: 1.6; color: rgb(var(--v-theme-on-surface-variant)); }
.notes-text { white-space: pre-wrap; }

.items-list { display: flex; flex-direction: column; gap: 10px; }
.item-row {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 12px 0; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}
.item-row:last-child { border-bottom: none; }
.item-name { font-size: 13px; font-weight: 700; }
.item-condition { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 4px; font-style: italic; }
.muted { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.resolution-badge { display: inline-flex; padding: 3px 10px; border-radius: var(--r-full); font-size: 10px; font-weight: 700; flex-shrink: 0; }
.resolution-badge.refund       { background: rgba(192, 83, 62, 0.12); color: #C0533E; }
.resolution-badge.exchange     { background: rgba(110, 143, 184, 0.15); color: #6E8FB8; }
.resolution-badge.store_credit { background: rgba(184, 134, 47, 0.12); color: #B8862F; }

.info-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; margin-bottom: 8px; }
.info-row:last-child { margin-bottom: 0; }

.order-link { text-decoration: none; color: inherit; display: flex; align-items: center; justify-content: space-between; }
.order-total { font-size: 13px; font-weight: 700; color: rgb(var(--v-theme-secondary)); }

@media (min-width: 960px) {
  .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }
}
</style>