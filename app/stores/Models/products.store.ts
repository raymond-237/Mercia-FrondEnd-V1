import type { ProductCardData, CategoryData } from '~/types/public/index.type'
import type { ProductDetailData, ProductFormData } from '~/types/Models/product.type'
import { acceptHMRUpdate, defineStore } from 'pinia'
import useCategoriesService from '~/services/Models/categories.service'
import useProductsService from '~/services/Models/products.service'

interface PaginationState {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export const useProductsStore = defineStore('products', () => {

  const productsService   = useProductsService()
  const categoriesService = useCategoriesService()

  // -- State

  const products        = ref<ProductCardData[]>([])
  const categories       = ref<CategoryData[]>([])
  const currentProduct   = ref<ProductDetailData | null>(null)
  const pagination       = ref<PaginationState | null>(null)

  const loading          = ref(false)
  const loadingProduct   = ref(false)
  const error            = ref<string | null>(null)

  // -- Getters

  const hasProducts = computed(() => products.value.length > 0)

  // -- Actions

  async function fetchProducts(params: {
    page?: number
    category?: string
    search?: string
    sort?: string
    include?: string
    status?: string
    isVisible?: boolean
  } = {}): Promise<ProductCardData[]> {
    loading.value = true
    error.value   = null

    try {
      const { data, meta } = await productsService.list(params)
      products.value   = data ?? []
      pagination.value = meta?.page ?? null
      return products.value
    } catch (e: any) {
      console.error('fetchProducts erreur brute:', e)
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de charger les produits.'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère le détail COMPLET d'un produit (medias[], variants[],
   * category{} intacts) — utilisé par la fiche produit publique et
   * le formulaire d'édition admin.
   */
  async function fetchProductBySlug(slug: string, include?: string): Promise<ProductDetailData | null> {
    loadingProduct.value = true
    error.value          = null

    try {
      const product = await productsService.show(slug, include)
      currentProduct.value = product ?? null
      return currentProduct.value
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Produit introuvable.'
      currentProduct.value = null
      return null
    } finally {
      loadingProduct.value = false
    }
  }

  /**
   * Réservée à l'admin (backoffice) — résolution directe par UUID, jamais
   * par slug. Voir products.service.ts::showById() pour le pourquoi.
   */
  async function fetchProductById(id: string, include?: string): Promise<ProductDetailData | null> {
    loadingProduct.value = true
    error.value          = null

    try {
      const product = await productsService.showById(id, include)
      currentProduct.value = product ?? null
      return currentProduct.value
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Produit introuvable.'
      currentProduct.value = null
      return null
    } finally {
      loadingProduct.value = false
    }
  }

  async function fetchCategories(): Promise<CategoryData[]> {
    try {
      const data = await categoriesService.list()
      categories.value = data ?? []
      return categories.value
    } catch (e) {
      categories.value = []
      return []
    }
  }

  const saving = ref(false)

  async function createProduct(payload: ProductFormData): Promise<ProductDetailData | null> {
    saving.value = true
    error.value  = null
    try {
      const product = await productsService.create(payload)

      if (product && payload.variants?.length) {
        for (const variant of payload.variants) {
          try {
            await productsService.createVariant(product.id, variant)
          } catch (variantError) {
            console.error('Erreur création variante:', variant.label, variantError)
          }
        }
      }

      return product
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de créer le produit.'
      return null
    } finally {
      saving.value = false
    }
  }

  async function updateProduct(id: string, payload: ProductFormData): Promise<ProductDetailData | null> {
    saving.value = true
    error.value  = null
    try {
      const product = await productsService.update(id, payload)

      const removedIds: string[] = (payload as any).removedVariantIds ?? []
      for (const variantId of removedIds) {
        try {
          await productsService.deleteVariant(variantId)
        } catch (e) {
          console.error('Erreur suppression variante:', variantId, e)
        }
      }

      // Variantes déjà existantes (id présent) — manquait entièrement avant :
      // seules les nouvelles variantes étaient sauvegardées, toute modif sur
      // une variante existante (prix, prix de revient, sku...) était perdue.
      const existingVariants = (payload.variants ?? []).filter((v: any) => !!v.id)
      for (const variant of existingVariants) {
        try {
          await productsService.updateVariant(variant.id, variant)
        } catch (e) {
          console.error('Erreur mise à jour variante:', variant.label, e)
        }
      }

      const newVariants = (payload.variants ?? []).filter((v: any) => !v.id)
      for (const variant of newVariants) {
        try {
          await productsService.createVariant(id, variant)
        } catch (e) {
          console.error('Erreur création variante:', variant.label, e)
        }
      }

      return product
    } catch (e: any) {
      error.value = e?.response?.data?.errors?.[0]?.detail ?? 'Impossible de modifier le produit.'
      return null
    } finally {
      saving.value = false
    }
  }

  return {
    // state
    products,
    categories,
    currentProduct,
    pagination,
    loading,
    loadingProduct,
    saving,
    error,
    // getters
    hasProducts,
    // actions
    fetchProducts,
    fetchProductBySlug,
    fetchProductById,
    fetchCategories,
    createProduct,
    updateProduct,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProductsStore, import.meta.hot))
}