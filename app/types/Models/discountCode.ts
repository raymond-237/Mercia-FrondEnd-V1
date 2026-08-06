export type DiscountType = 'percentage' | 'fixed'
export type DiscountAppliesTo = 'order' | 'product' | 'category'

export interface DiscountCodeListItem {
  id: string
  code: string
  // type: DiscountType
  value: number
  appliesTo: DiscountAppliesTo
  appliesToId: string | null
  minOrderAmount: number | null
  maxUses: number | null
  usedCount: number
  isActive: boolean
  startsAt: string | null
  expiresAt: string | null
  createdAt: string
  discountType: DiscountType
}

export interface DiscountCodeFormData {
  code: string
  // type: DiscountType
  value: number | null
  appliesTo: DiscountAppliesTo
  appliesToId: string | null
  minOrderAmount: number | null
  maxUses: number | null
  isActive: boolean
  startsAt: string | null
  expiresAt: string | null
   discountType: DiscountType 
}