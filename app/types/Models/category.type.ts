export interface CategoryFormData {
  name: string
  slug: string
  description: string
  metaTitle: string
  metaDescription: string
  isActive: boolean
  position: number
}

export interface CategoryListItem {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  position: number
  productCount?: number
}