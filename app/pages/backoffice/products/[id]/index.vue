<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useProductsStore } from '~/stores/Models/products.store'

const route = useRoute()
const productsStore = useProductsStore()
definePageMeta({ layout: 'admin' })
const loading  = ref(true)
const notFound = ref(false)
const product  = ref<any>(null)
const activeImage = ref(0)

const loadProduct = async () => {
  loading.value  = true
  notFound.value = false
  activeImage.value = 0

  try {
    const data = await productsStore.fetchProductById(
      route.params.id as string,
      'medias,category,productVariants.inventory,optionTypes',
    )
    if (!data) { notFound.value = true; product.value = null; return }
    product.value = data
  } catch (e) {
    console.error('Erreur chargement détail produit:', e)
    notFound.value = true
    product.value = null
  } finally {
    loading.value = false
  }
}
onMounted(loadProduct)

// Sans ça, naviguer d'une fiche produit à une autre (clic depuis la liste,
// ou lien direct) sans passer par un rechargement complet de page ne
// redéclenche jamais le fetch — Vue Router réutilise le même composant
// puisque c'est la même route, seul route.params.id change. L'ancien
// produit restait affiché malgré une URL différente.
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) loadProduct()
})

const images = computed(() => product.value?.medias?.map((m: any) => m.url) ?? (product.value?.imageUrl ? [product.value.imageUrl] : []))

const totalStock = computed(() => {
  if (product.value?.variants?.length) {
    return product.value.variants.reduce((sum: number, v: any) => sum + (v.stockQuantity ?? 0), 0)
  }
  return product.value?.stockQuantity ?? 0
})

const lowStockVariants = computed(() =>
  (product.value?.variants ?? []).filter((v: any) => v.stockQuantity > 0 && v.stockQuantity <= 5),
)
const outOfStockVariants = computed(() =>
  (product.value?.variants ?? []).filter((v: any) => v.stockQuantity === 0),
)

const statusLabel: Record<string, string> = { draft: 'Brouillon', active: 'Publié', archived: 'Archivé' }

// ── Recommandations — calculées à partir des vraies données du produit.
// Pas de trafic/analytics réel disponible pour l'instant (aucun tracking
// de vues côté backend) : ces suggestions sont des règles métier concrètes
// qui aident réellement à améliorer la fiche, en attendant un futur module
// de vraies statistiques de trafic/conversion si tu veux qu'on le construise.
interface Insight {
  icon: string
  color: 'warning' | 'error' | 'info' | 'success'
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}

const insights = computed<Insight[]>(() => {
  if (!product.value) return []
  const list: Insight[] = []
  const p = product.value

  if (images.value.length === 0) {
    list.push({
      icon: 'solar:gallery-line-duotone', color: 'error',
      title: 'Aucune photo',
      description: 'Un produit sans image convertit très rarement. Ajoute au moins une photo principale.',
      actionLabel: 'Ajouter des photos', actionTo: `/backoffice/products/${p.id}/edit`,
    })
  } else if (images.value.length < 3) {
    list.push({
      icon: 'solar:gallery-add-line-duotone', color: 'warning',
      title: 'Peu de photos',
      description: `Seulement ${images.value.length} photo${images.value.length > 1 ? 's' : ''} — les fiches avec 3 à 5 angles rassurent davantage les clients avant l'achat.`,
      actionLabel: 'Ajouter des photos', actionTo: `/backoffice/products/${p.id}/edit`,
    })
  }

  if (p.status === 'draft') {
    list.push({
      icon: 'solar:rocket-line-duotone', color: 'info',
      title: 'Produit encore en brouillon',
      description: 'Ce produit est invisible sur la boutique. Publie-le une fois la fiche prête.',
      actionLabel: 'Publier', actionTo: `/backoffice/products/${p.id}/edit`,
    })
  }

  if (outOfStockVariants.value.length > 0) {
    list.push({
      icon: 'solar:close-circle-line-duotone', color: 'error',
      title: `${outOfStockVariants.value.length} variante(s) en rupture`,
      description: outOfStockVariants.value.map((v: any) => v.name).join(', ') + ' — plus commandable tant que le stock n\'est pas réapprovisionné.',
      actionLabel: 'Gérer le stock', actionTo: '/backoffice/inventory',
    })
  } else if (lowStockVariants.value.length > 0) {
    list.push({
      icon: 'solar:danger-triangle-line-duotone', color: 'warning',
      title: `${lowStockVariants.value.length} variante(s) en stock faible`,
      description: lowStockVariants.value.map((v: any) => `${v.name} (${v.stockQuantity})`).join(', ') + ' — pense à réapprovisionner bientôt.',
      actionLabel: 'Gérer le stock', actionTo: '/backoffice/inventory',
    })
  } else if (!p.variants?.length && totalStock.value === 0) {
    list.push({
      icon: 'solar:close-circle-line-duotone', color: 'error',
      title: 'Produit en rupture',
      description: 'Aucun stock disponible — le produit ne peut pas être commandé.',
      actionLabel: 'Gérer le stock', actionTo: '/backoffice/inventory',
    })
  }

  if (!p.description || p.description.length < 40) {
    list.push({
      icon: 'solar:document-text-line-duotone', color: 'warning',
      title: 'Description trop courte',
      description: 'Une description détaillée (matière, entretien, tenue) aide à convaincre et réduit les questions avant achat.',
      actionLabel: 'Compléter', actionTo: `/backoffice/products/${p.id}/edit`,
    })
  }

  if (!p.seoTitle || !p.seoDescription) {
    list.push({
      icon: 'solar:magnifer-line-duotone', color: 'info',
      title: 'SEO incomplet',
      description: 'Titre ou description SEO manquants — ça limite la visibilité du produit dans les recherches Google.',
      actionLabel: 'Compléter le SEO', actionTo: `/backoffice/products/${p.id}/edit`,
    })
  }

  if (p.comparePrice && Number(p.comparePrice) <= Number(p.price)) {
    list.push({
      icon: 'solar:tag-price-line-duotone', color: 'warning',
      title: 'Prix barré incohérent',
      description: 'Le prix barré est inférieur ou égal au prix actuel — ça n\'affiche aucune remise visible pour le client.',
      actionLabel: 'Corriger', actionTo: `/backoffice/products/${p.id}/edit`,
    })
  }

  if (list.length === 0) {
    list.push({
      icon: 'solar:check-circle-line-duotone', color: 'success',
      title: 'Fiche produit complète',
      description: 'Photos, description, SEO et stock sont en bon état — rien à signaler pour l\'instant.',
    })
  }

  return list
})

// ── Archiver / Supprimer

async function archiveThisProduct() {
  if (!product.value) return
  const success = await productsStore.archiveProduct(product.value.id)
  if (success) product.value.status = 'archived'
  notify(
    success ? 'Produit archivé avec succès.' : (productsStore.error ?? 'Impossible d\'archiver le produit.'),
    success ? 'success' : 'error',
  )
}

const deleteConfirmOpen = ref(false)

async function confirmDeleteThisProduct() {
  if (!product.value) return
  deleteConfirmOpen.value = false

  const success = await productsStore.deleteProduct(product.value.id)
  if (success) {
    notify('Produit supprimé avec succès.', 'success')
    navigateTo('/backoffice/products')
  } else {
    notify(productsStore.error ?? 'Impossible de supprimer le produit.', 'error')
  }
}
</script>

<template>
  <div>

    <UiBreadCrumbs :items="[
      { label: 'Produits', icon: 'solar:box-line-duotone', to: '/backoffice/products' },
      { label: product?.name ?? '...' },
    ]">
      <v-btn v-if="product" color="secondary" variant="flat" rounded="xl" :to="`/backoffice/products/${product.id}/edit`">
        <Icon icon="solar:pen-line-duotone" width="16" style="margin-right: 6px;" />
        Modifier
      </v-btn>
      <v-menu v-if="product">
        <template #activator="{ props: menuProps }">
          <v-btn icon variant="tonal" color="primary" rounded="xl" v-bind="menuProps">
            <Icon icon="solar:menu-dots-line-duotone" width="18" />
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item :to="`/shop/${product.slug}`" target="_blank">
            <Icon icon="solar:eye-line-duotone" width="16" style="margin-right: 8px;" />
            Voir sur la boutique
          </v-list-item>
          <v-list-item>
            <Icon icon="solar:copy-line-duotone" width="16" style="margin-right: 8px;" />
            Dupliquer
          </v-list-item>
          <v-list-item @click="archiveThisProduct">
            <Icon icon="solar:archive-line-duotone" width="16" style="margin-right: 8px;" />
            Archiver
          </v-list-item>
          <v-list-item class="danger-item" @click="deleteConfirmOpen = true">
            <Icon icon="solar:trash-bin-trash-line-duotone" width="16" style="margin-right: 8px;" />
            Supprimer
          </v-list-item>
        </v-list>
      </v-menu>
    </UiBreadCrumbs>

    <v-dialog v-model="deleteConfirmOpen" max-width="360">
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="text-body-1 font-weight-bold">Supprimer ce produit ?</v-card-title>
        <v-card-text class="text-body-2">
          "{{ product?.name }}" sera définitivement supprimé, y compris ses variantes et médias associés. Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteConfirmOpen = false">Annuler</v-btn>
          <v-btn color="error" variant="flat" rounded="xl" @click="confirmDeleteThisProduct">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div v-if="loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <div v-else-if="notFound" class="empty-block">
      <Icon icon="solar:box-minimalistic-line-duotone" width="36" />
      <p>Produit introuvable.</p>
    </div>

    <div v-else class="detail-layout">

      <!-- Colonne galerie -->
      <div class="gallery-col">
        <div class="main-image">
          <img v-if="images[activeImage]" :src="images[activeImage]" :alt="product.name">
          <div v-else class="image-placeholder"><Icon icon="solar:box-line-duotone" width="40" /></div>
        </div>
        <div v-if="images.length > 1" class="thumbs">
          <button v-for="(img, i) in images" :key="i" class="thumb" :class="{ active: activeImage === i }" @click="activeImage = i">
            <img :src="img" :alt="`Vue ${i + 1}`">
          </button>
        </div>
      </div>

      <!-- Colonne infos -->
      <div class="info-col">

        <div class="info-header">
          <span class="status-badge" :class="product.status">{{ statusLabel[product.status] ?? product.status }}</span>
          <h1>{{ product.name }}</h1>
          <p class="category">{{ product.category?.name ?? 'Sans catégorie' }}</p>
        </div>

        <div class="price-block">
          <span class="price">{{ product.price }}€</span>
          <span v-if="product.comparePrice" class="compare">{{ product.comparePrice }}€</span>
        </div>

        <div class="mini-stats">
          <div class="mini-stat">
            <Icon icon="solar:box-line-duotone" width="28" />
            <div><div class="mini-stat-value">{{ totalStock }}</div><div class="mini-stat-label">Stock total</div></div>
          </div>
          <div class="mini-stat">
            <Icon icon="solar:widget-2-line-duotone" width="28" />
            <div><div class="mini-stat-value">{{ product.variants?.length ?? 0 }}</div><div class="mini-stat-label">Variantes</div></div>
          </div>
          <div class="mini-stat">
            <Icon icon="solar:gallery-line-duotone" width="28" />
            <div><div class="mini-stat-value">{{ images.length }}</div><div class="mini-stat-label">Photos</div></div>
          </div>
        </div>

        <div v-if="product.description" class="description-block">
          <h3>Description</h3>
          <p>{{ product.description }}</p>
        </div>

      </div>

    </div>

    <!-- Recommandations -->
    <div v-if="!loading && !notFound" class="insights-panel">
      <div class="insights-head">
        <h2>Recommandations</h2>
        <p class="insights-sub">Suggestions pour améliorer la performance de cette fiche.</p>
      </div>

      <div class="insights-list">
        <div v-for="(insight, i) in insights" :key="i" class="insight-row" :class="insight.color">
          <div class="insight-icon"><Icon :icon="insight.icon" width="20" /></div>
          <div class="insight-body">
            <div class="insight-title">{{ insight.title }}</div>
            <div class="insight-desc">{{ insight.description }}</div>
          </div>
          <v-btn v-if="insight.actionTo" variant="tonal" size="small" rounded="xl" :color="insight.color" :to="insight.actionTo" class="insight-action">
            {{ insight.actionLabel }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Table variantes -->
    <div v-if="!loading && product?.variants?.length" class="variants-panel">
      <h2>Variantes</h2>
      <table class="variants-table">
        <thead><tr><th>Variante</th><th>SKU</th><th>Prix</th><th>Stock</th></tr></thead>
        <tbody>
          <tr v-for="v in product.variants" :key="v.id">
            <td>{{ v.name }}</td>
            <td class="muted">{{ v.sku }}</td>
            <td class="amount">{{ v.price }}€</td>
            <td>
              <span class="stock-badge" :class="v.stockQuantity === 0 ? 'out' : v.stockQuantity <= 5 ? 'low' : 'ok'">
                {{ v.stockQuantity }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<style scoped>
.loading-block, .empty-block {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px 0; color: rgb(var(--v-theme-on-surface-variant));
}
.danger-item { color: #C0533E; }

.detail-layout { display: flex; flex-direction: column; gap: 24px; margin-bottom: 20px; }

.gallery-col { }
.main-image {
  aspect-ratio: 1; border-radius: var(--r-xl); overflow: hidden;
  background: rgb(var(--v-theme-surface-variant)); margin-bottom: 10px;
}
.main-image img { width: 100%; height: 100%; object-fit: cover; }
.image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgb(var(--v-theme-on-surface-variant)); }
.thumbs { display: flex; gap: 8px; overflow-x: auto; }
.thumb { width: 56px; height: 56px; border-radius: var(--r-md); overflow: hidden; border: 2px solid transparent; cursor: pointer; flex-shrink: 0; }
.thumb.active { border-color: rgb(var(--v-theme-secondary)); }
.thumb img { width: 100%; height: 100%; object-fit: cover; }

.info-col {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 22px;
}
.status-badge { display: inline-flex; padding: 4px 12px; border-radius: var(--r-full); font-size: 10.5px; font-weight: 700; margin-bottom: 10px; }
.status-badge.draft     { background: rgba(var(--v-theme-on-surface), 0.08); color: rgb(var(--v-theme-on-surface-variant)); }
.status-badge.active { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.status-badge.archived  { background: rgba(192, 83, 62, 0.12); color: #C0533E; }

.info-header h1 { font-family: 'Fraunces', serif; font-size: 21px; font-weight: 700; margin-bottom: 4px; }
.category { font-size: 12.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 16px; }

.price-block { display: flex; align-items: baseline; gap: 10px; margin-bottom: 20px; }
.price { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700; color: rgb(var(--v-theme-secondary)); }
.compare { font-size: 14px; text-decoration: line-through; color: rgb(var(--v-theme-on-surface-variant)); }

.mini-stats { display: flex; gap: 16px; padding: 16px 0; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06); border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06); margin-bottom: 20px; }
.mini-stat { display: flex; align-items: center; gap: 8px; color: rgb(var(--v-theme-secondary)); }
.mini-stat-value { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); line-height: 1.1; }
.mini-stat-label { font-size: 10px; color: rgb(var(--v-theme-on-surface-variant)); }

.description-block h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 8px; }
.description-block p { font-size: 13px; line-height: 1.65; color: rgb(var(--v-theme-on-surface-variant)); }

/* Insights */
.insights-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 20px; margin-bottom: 20px;
}
.insights-head { margin-bottom: 16px; }
.insights-head h2 { font-size: 15px; font-weight: 700; }
.insights-sub { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 2px; }

.insights-list { display: flex; flex-direction: column; gap: 10px; }
.insight-row {
  display: flex; align-items: flex-start; gap: 12px;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg); padding: 14px;
  border-left: 3px solid transparent;
}
.insight-row.warning { border-left-color: #B8862F; }
.insight-row.error   { border-left-color: #C0533E; }
.insight-row.info    { border-left-color: #6E8FB8; }
.insight-row.success { border-left-color: #4C7A4C; }

.insight-icon {
  width: 34px; height: 34px; border-radius: var(--r-md);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.insight-row.warning .insight-icon { background: rgba(217, 164, 65, 0.15); color: #B8862F; }
.insight-row.error   .insight-icon { background: rgba(192, 83, 62, 0.12); color: #C0533E; }
.insight-row.info    .insight-icon { background: rgba(110, 143, 184, 0.15); color: #6E8FB8; }
.insight-row.success .insight-icon { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }

.insight-body { flex: 1; min-width: 0; }
.insight-title { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
.insight-desc { font-size: 12px; line-height: 1.5; color: rgb(var(--v-theme-on-surface-variant)); }
.insight-action { flex-shrink: 0; margin-top: 2px; }

.variants-panel {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: var(--r-xl); padding: 22px;
}
.variants-panel h2 { font-size: 15px; font-weight: 700; margin-bottom: 14px; }
.variants-table { width: 100%; border-collapse: collapse; }
.variants-table th { text-align: left; font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: rgb(var(--v-theme-on-surface-variant)); padding: 8px 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }
.variants-table td { padding: 10px; font-size: 12.5px; font-weight: 600; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }
.muted { color: rgb(var(--v-theme-on-surface-variant)); font-weight: 400; }
.amount { font-weight: 700; }
.stock-badge { display: inline-flex; padding: 3px 10px; border-radius: var(--r-full); font-size: 10.5px; font-weight: 700; }
.stock-badge.ok  { background: rgba(76, 122, 76, 0.12); color: #4C7A4C; }
.stock-badge.low { background: rgba(217, 164, 65, 0.15); color: #B8862F; }
.stock-badge.out { background: rgba(192, 83, 62, 0.12); color: #C0533E; }

@media (min-width: 640px) {
  .insight-row { align-items: center; }
}

@media (min-width: 960px) {
  .detail-layout { flex-direction: row; }
  .gallery-col { width: 360px; flex-shrink: 0; }
  .info-col { flex: 1; }
}
</style>