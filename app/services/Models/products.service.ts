import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize, JsonaSerialize } from '~/@cores/jsonabuilder'
import { CATEGORIES, PRODUCTS, PRODUCT_VARIANTS, SUPPLIERS } from '~/@cores/constantes/apiresource'
import type { ProductCardData } from '~/types/public/index.type'
import type { ProductDetailData, ProductFormData } from '~/types/Models/product.type'

interface ProductListQuery {
  page?: number
  perPage?: number
  category?: string
  search?: string
  sort?: string
  include?: string
  status?: string
  isVisible?: boolean
  priceMin?: number
  priceMax?: number
}

interface ProductListResult {
  data: ProductCardData[]
  meta: Record<string, any>
}

/**
 * Les variantes stockent actuellement leur couleur en texte libre dans
 * `name`, au format "Label (#HEXCODE)". Pont temporaire tant que le
 * backoffice n'expose pas d'attributs structurés via optionTypes.
 */
function parseVariantColor(name: string): { label: string; hex: string } | null {
  const match = name?.match(/^(.*?)\s*\(#([0-9a-fA-F]{6})\)$/)
  return match ? { label: match[1].trim(), hex: `#${match[2]}` } : null
}

/**
 * Version légère — pour les listes/cards (index produits, storefront).
 * N'expose que ce dont une card a besoin.
 */
function mapProductToCardData(raw: any): ProductCardData {
  const medias: any[] = Array.isArray(raw?.medias) ? raw.medias : []
  const images = medias.map(m => m.url).filter(Boolean)

  const variants: any[] = Array.isArray(raw?.productVariants) ? raw.productVariants : []
  const defaultVariant = variants.find(v => v.isDefault) ?? variants[0]

  const colorsRaw = variants.map(v => parseVariantColor(v.name)).filter((c): c is { label: string; hex: string } => !!c)
  const colors = Array.from(new Map(colorsRaw.map(c => [c.label, c])).values())

  return {
    id:               raw.id,
    slug:             raw.slug,
    name:             raw.name,
    variantName:      defaultVariant?.name ?? '',
    price:            Number(raw.price ?? 0),
    comparePrice:     raw.comparePrice != null ? Number(raw.comparePrice) : null,
    imageUrl:         images[0] ?? '',
    images,
    colors,
    rating:           raw.rating ?? null,
    isNew:            raw.isNew ?? false,
    isBestSeller:     raw.isBestSeller ?? false,
    isCare:           raw.isCare ?? false,
    stockQuantity:    variants.reduce((sum, v) => sum + (v.stockQuantity ?? 0), 0),
    lowStockThreshold: defaultVariant?.inventory?.lowStockThreshold ?? 5,
    shippingEstimate: raw.shippingEstimate ?? '',
    defaultVariantId: defaultVariant?.id ?? '',
    minQuantity:      raw.minQuantity ?? 1,
    maxQuantity:      raw.maxQuantity ?? null,
  } as ProductCardData
}

/**
 * Version complète — pour la fiche produit publique ET la page détail
 * admin. Garde les variantes et médias avec tous les attributs bruts
 * nécessaires (isDefault/isActive/quantités, collection/order média) —
 * rien n'est aplati ou perdu ici, contrairement à mapProductToCardData.
 */
function mapProductToDetail(raw: any): ProductDetailData {
  const medias: any[] = Array.isArray(raw?.medias) ? raw.medias : []
  const variants: any[] = Array.isArray(raw?.productVariants) ? raw.productVariants : []

  return {
    id:               raw.id,
    slug:             raw.slug,
    name:             raw.name,
    description:      raw.description ?? null,
    shortDescription: raw.shortDescription ?? null,
    price:            Number(raw.price ?? 0),
    comparePrice:     raw.comparePrice != null ? Number(raw.comparePrice) : null,
    costPrice:        raw.costPrice != null ? Number(raw.costPrice) : null,
    sku:              raw.sku ?? null,
    status:           raw.status ?? 'draft',
    seoTitle:         raw.seoTitle ?? null,
    seoDescription:   raw.seoDescription ?? null,
    category:         raw.category
      ? { id: raw.category.id, name: raw.category.name, slug: raw.category.slug ?? null }
      : null,
    supplier:         raw.supplier
      ? { id: raw.supplier.id, name: raw.supplier.name }
      : null,
    medias: medias.map(m => ({
      id:         m.id,
      url:        m.url,
      collection: m.collection ?? null,
      order:      m.order ?? 0,
    })),
    // Nommé "variants" (pas "productVariants") — c'est ce que
    // product-detail.vue lit partout (totalStock, tableau des variantes,
    // lowStockVariants/outOfStockVariants). Décalage pré-existant qui
    // faisait planter silencieusement l'affichage du stock.
    variants: variants.map(v => ({
      id:            v.id,
      name:          v.name,
      sku:           v.sku ?? null,
      price:         Number(v.price ?? 0),
      // Le Schema ProductVariant expose "purchasePrice" (pas "costPrice",
      // contrairement au Product) — costPrice ici est juste le nom de champ
      // interne côté frontend, gardé pour ne pas casser AdminProductForm.
      costPrice:     v.purchasePrice != null ? Number(v.purchasePrice) : null,
      isDefault:     v.isDefault ?? false,
      isActive:      v.isActive ?? true,
      minQuantity:   v.minQuantity ?? 1,
      maxQuantity:   v.maxQuantity ?? null,
      stockQuantity: v.stockQuantity ?? v.inventory?.quantity ?? 0,
    })),
  } as ProductDetailData
}

/**
 * Construit le document JSON:API pour create/update produit.
 * category ET supplier sont des relations (BelongsTo) — jamais des
 * attributs plats, sinon l'API rejette avec "is not a supported attribute"
 * (même principe que parentId sur Category).
 */
function buildProductDocument(payload: ProductFormData, id?: string) {
  const { category, supplier, media, optionTypes, variants, removedVariantIds, ...rest } = payload as any

  const uploadedMedia    = media?.filter((m: any) => m.remoteId) ?? []
  const thumbnailMediaId = uploadedMedia[0]?.remoteId
  const galleryMediaIds  = uploadedMedia.slice(1).map((m: any) => m.remoteId)

  const attributes = {
    ...rest,
    productType: variants?.length ? 'variable' : 'simple',
    thumbnailMediaId,
    galleryMediaIds,
  }

  const base = JsonaSerialize(PRODUCTS, attributes) as any
  if (id) base.data.id = id

  base.data.relationships = { ...base.data.relationships }

  if (category) {
    base.data.relationships.category = { data: { type: CATEGORIES, id: category } }
  }

  // Optionnelle — un produit peut ne pas avoir de fournisseur. On envoie
  // quand même { data: null } explicitement si absent, pour permettre de
  // RETIRER un fournisseur déjà assigné en édition (contrairement à
  // category, où omettre la relation en cas d'absence est acceptable
  // puisqu'elle est censée toujours être renseignée).
  base.data.relationships.supplier = {
    data: supplier ? { type: SUPPLIERS, id: supplier } : null,
  }

  return base
}

function buildVariantDocument(productId: string, variant: any) {
  const attributes = {
    name: variant.label,
    sku: variant.sku || undefined,
    price: variant.price,
    // Le Schema expose "purchasePrice" -> colonne purchase_price, la même
    // que lit OrderService::buildAndValidateLines() et AnalyticsService —
    // jamais "costPrice", qui pointait vers une colonne (cost_price) que
    // rien d'autre dans le backend ne consulte.
    purchasePrice: variant.costPrice ?? undefined,
    initialStock: variant.stock ?? 0,
  }

  const base = JsonaSerialize(PRODUCT_VARIANTS, attributes) as any
  base.data.relationships = {
    product: { data: { type: PRODUCTS, id: productId } },
  }
  return base
}

/**
 * Update d'une variante EXISTANTE — volontairement sans initialStock
 * (ce champ ne sert qu'à la création, le réenvoyer sur un update
 * risquerait d'écraser le stock réel géré depuis ailleurs).
 */
function buildVariantUpdateDocument(variantId: string, variant: any) {
  const attributes = {
    name: variant.label,
    sku: variant.sku || undefined,
    price: variant.price,
    purchasePrice: variant.costPrice ?? undefined,
  }

  const base = JsonaSerialize(PRODUCT_VARIANTS, attributes) as any
  base.data.id = variantId
  return base
}

export default function useProductsService() {

  /**
   * GET /api/v1/products — pour les listes (cards)
   */
  const list = async (query: ProductListQuery = {}): Promise<ProductListResult> => {
    const priceRange = (query.priceMin != null || query.priceMax != null)
      ? `${query.priceMin ?? ''},${query.priceMax ?? ''}`
      : undefined

    const response: AxiosResponse = await request('products', {
      method: 'get',
      params: {
        'page[number]': query.page,
        'page[size]': query.perPage,
        'filter[categoryId]': query.category,
        'filter[search]': query.search,
        'filter[status]': query.status,
        'filter[isVisible]': query.isVisible,
        'filter[priceRange]': priceRange,
        sort: query.sort,
        include: query.include,
      },
    })

    const raw = JsonaDeserialize<any[]>(response.data) ?? []

    return {
      data: raw.map(mapProductToCardData),
      meta: response.data?.meta ?? {},
    }
  }

  /**
   * GET /api/v1/products?filter[slug]=... — résolution par slug via la
   * route JSON:API standard (tenant/scoping déjà éprouvés partout
   * ailleurs). Remplace l'ancienne route storefront/products/{slug}
   * qui contournait la résolution tenant et renvoyait systématiquement
   * 404 en conditions réelles.
   */
  const show = async (idOrSlug: string, include?: string): Promise<ProductDetailData | null> => {
    const response: AxiosResponse = await request('products', {
      method: 'get',
      params: {
        'filter[slug]': idOrSlug,
        include,
      },
    })

    const raw = JsonaDeserialize<any[]>(response.data) ?? []
    const product = Array.isArray(raw) ? raw[0] : raw

    if (!product) return null

    return mapProductToDetail(product)
  }

    /**
   * GET /api/v1/products/{id} — résolution DIRECTE par UUID, réservée à
   * l'admin (backoffice navigue toujours par id, jamais par slug). Route
   * ressource JSON:API standard, aucune ambiguïté de filtre possible.
   */
  const showById = async (id: string, include?: string): Promise<ProductDetailData | null> => {
    const response: AxiosResponse = await request(`products/${id}`, {
      method: 'get',
      params: { include },
    })
 
    const raw = JsonaDeserialize<any>(response.data)
    if (!raw) return null
 
    return mapProductToDetail(raw)
  }

  /**
   * POST /api/v1/products
   */
  const create = async (payload: ProductFormData): Promise<ProductDetailData> => {
    const data = buildProductDocument(payload)
    const response: AxiosResponse = await request('products', {
      method: 'post',
      data,
    })
    const raw = JsonaDeserialize<any>(response.data)
    return mapProductToDetail(raw)
  }

  /**
   * PATCH /api/v1/products/{id}
   */
  const update = async (id: string, payload: ProductFormData): Promise<ProductDetailData> => {
    const data = buildProductDocument(payload, id)
    const response: AxiosResponse = await request(`products/${id}`, {
      method: 'patch',
      data,
    })
    const raw = JsonaDeserialize<any>(response.data)
    return mapProductToDetail(raw)
  }

  /**
   * POST /api/v1/product-variants
   */
  const createVariant = async (productId: string, variant: any) => {
    const data = buildVariantDocument(productId, variant)
    const response: AxiosResponse = await request('product-variants', {
      method: 'post',
      data,
    })
    return JsonaDeserialize<any>(response.data)
  }

  /**
   * PATCH /api/v1/product-variants/{id}
   * Manquait entièrement — sans elle, modifier une variante déjà créée
   * (prix, prix de revient, sku...) ne sauvegardait jamais rien.
   */
  const updateVariant = async (variantId: string, variant: any) => {
    const data = buildVariantUpdateDocument(variantId, variant)
    const response: AxiosResponse = await request(`product-variants/${variantId}`, {
      method: 'patch',
      data,
    })
    return JsonaDeserialize<any>(response.data)
  }

  /**
   * DELETE /api/v1/product-variants/{id}
   */
  const deleteVariant = async (variantId: string) => {
    await request(`product-variants/${variantId}`, { method: 'delete' })
  }

  return {
    list,
    show,
    showById,
    create,
    update,
    createVariant,
    updateVariant,
    deleteVariant,
  }
}