<script setup lang="ts">
import { notify } from '~/@cores/constantes/helpers'
import { useProductsStore } from '~/stores/Models/products.store'
import type { ProductFormData } from '~/types/Models/product.type'

const route = useRoute()
const productsStore = useProductsStore()
definePageMeta({ layout: 'admin' })

const loading  = ref(true)
const notFound = ref(false)
const product  = ref<any>(null)
const submitError = ref('')

const initialData = computed(() => {
  if (!product.value) return undefined

  // Reconstruit les variantes réelles (avec leur vrai stock depuis
  // l'inventaire) pour que le formulaire les affiche et permette de
  // les modifier/supprimer — plus le TODO placeholder d'avant.
  //
  // costPrice ajouté ici : la donnée était déjà exposée par
  // mapProductToDetail() côté service, juste jamais relue dans ce
  // mapping — le prix de revient était bien sauvegardé en base mais
  // n'apparaissait jamais au ré-ouvrir du formulaire d'édition.
  const variants = (product.value.variants ?? product.value.productVariants ?? []).map((v: any) => ({
    id: v.id,
    key: v.id,
    label: v.name,
    sku: v.sku ?? '',
    price: Number(v.price ?? 0),
    costPrice: v.costPrice != null ? Number(v.costPrice) : null,
    stock: v.stockQuantity ?? v.inventory?.quantity ?? 0,
  }))

  // Reconstruit un type d'option unique "Variante" à partir des noms
  // existants, pour que la génération automatique ne les efface pas
  // tant que l'utilisateur n'a rien changé côté options.
  const optionTypes = variants.length
    ? [{ id: crypto.randomUUID(), name: 'Variante', values: variants.map((v: any) => v.label) }]
    : []

  return {
    name: product.value.name,
    slug: product.value.slug,
    category: product.value.category?.id ?? null,
    price: product.value.price,
    comparePrice: product.value.comparePrice ?? null,
    costPrice: product.value.costPrice ?? null,
    sku: product.value.sku ?? '',
    shortDescription: product.value.shortDescription ?? '',
    description: product.value.description ?? '',
    status: product.value.status ?? 'draft',
    seoTitle: product.value.seoTitle ?? '',
    seoDescription: product.value.seoDescription ?? '',
    media: (product.value.medias ?? []).map((m: any) => ({ id: m.id, url: m.url, isExisting: true })),
    optionTypes,
    variants,
  }
})

const loadProduct = async () => {
  loading.value  = true
  notFound.value = false

  try {
    const data = await productsStore.fetchProductById(
      route.params.id as string,
      'medias,category,productVariants,productVariants.inventory,optionTypes',
    )
    if (!data) { notFound.value = true; product.value = null; return }
    product.value = data
  } catch (e) {
    console.error('Erreur chargement produit édition:', e)
    notFound.value = true
    product.value = null
  } finally {
    loading.value = false
  }
}
onMounted(loadProduct)

// Même bug que sur la page détail : sans ce watch, passer directement du
// formulaire d'édition du produit A à celui du produit B (navigation SPA,
// même route réutilisée) laissait le formulaire pré-rempli avec les
// données de A alors que l'URL affichait déjà B.
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) loadProduct()
})

async function onSubmit(data: ProductFormData) {
  submitError.value = ''
  // Bug corrigé : route.params.slug n'existe pas sur cette route (le
  // paramètre s'appelle "id" partout ailleurs dans ce fichier) — ça
  // envoyait systématiquement undefined comme identifiant à updateProduct().
  const result = await productsStore.updateProduct(route.params.id as string, data)

  if (!result) {
    submitError.value = productsStore.error ?? 'Impossible de modifier le produit.'
    return
  }
  notify('Produit modifié avec succès.', 'success')
  navigateTo(`/backoffice/products/${route.params.id}`)
}
</script>

<template>
  <div>
    <UiBreadCrumbs :items="[
      { label: 'Produits', icon: 'solar:box-line-duotone', to: '/backoffice/products' },
      { label: product?.name ?? 'Modifier' },
    ]" />

    <div v-if="loading" class="loading-block">
      <v-progress-circular indeterminate color="secondary" size="28" />
    </div>

    <div v-else-if="notFound" class="empty-block">
      <Icon icon="solar:box-minimalistic-line-duotone" width="36" />
      <p>Produit introuvable.</p>
    </div>

    <template v-else>
      <v-expand-transition>
        <div v-if="submitError" class="error-block">
          <Icon icon="solar:danger-triangle-line-duotone" width="16" />
          {{ submitError }}
        </div>
      </v-expand-transition>

      <AdminProductForm mode="edit" :initial-data="initialData" :saving="productsStore.saving" @submit="onSubmit" />
    </template>
  </div>
</template>

<style scoped>
.loading-block, .empty-block {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 48px 0; color: rgb(var(--v-theme-on-surface-variant));
}
.error-block {
  display: flex; align-items: center; gap: 8px;
  background: rgba(192, 83, 62, 0.1); color: #C0533E;
  border-radius: var(--r-lg); padding: 12px;
  font-size: 12.5px; font-weight: 600; margin-bottom: 16px;
}
</style>