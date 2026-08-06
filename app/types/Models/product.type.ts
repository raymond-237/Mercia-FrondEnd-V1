
export interface ProductFormMedia {
  id: string           // id local (clé Vue, avant upload)
  url: string           // aperçu — blob local pendant l'upload, puis URL réelle
  remoteId?: string     // id réel renvoyé par POST /medias/upload — celui qu'on envoie au produit
  isExisting?: boolean  // vrai si le média vient déjà du produit (édition)
  uploading?: boolean
  uploadError?: boolean
}

export interface ProductFormOptionType {
  id: string
  name: string
  values: string[]
}

export interface ProductFormVariant {
  key: string
  label: string
  price: number | null
  stock: number | null
  sku: string
}

export interface ProductFormData {
  name: string
  slug: string
  category: string | null
  price: number | null
  comparePrice: number | null
  sku: string
  shortDescription: string
  description: string
  status: 'draft' | 'active' | 'archived'
  seoTitle: string
  seoDescription: string
  media: ProductFormMedia[]
  optionTypes: ProductFormOptionType[]
  variants: ProductFormVariant[]
}

export interface ProductVariantDetail {
  id: string
  name: string
  sku: string | null
  price: number
  stockQuantity: number
}

export interface ProductMediaDetail {
  id: string
  url: string
}

export interface ProductDetailData {
  id: string
  slug: string
  name: string
  description: string | null
  shortDescription: string | null
  price: number
  comparePrice: number | null
  sku: string | null
  status: string
  seoTitle: string | null
  seoDescription: string | null
  category: { id: string; name: string } | null
  medias: ProductMediaDetail[]
  variants: ProductVariantDetail[]
}