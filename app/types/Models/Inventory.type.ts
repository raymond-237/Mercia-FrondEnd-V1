export type MovementType = 'in' | 'out' | 'adjustment'

export interface InventoryVariantInfo {
  id: string
  sku: string | null
  name: string | null
  productName: string | null
  productId: string | null
}

export interface InventoryListItem {
  id: string
  quantity: number
  lowStockThreshold: number
  createdAt: string
  updatedAt: string
  productVariant: InventoryVariantInfo | null
}

export interface InventoryMovementItem {
  id: string
  type: MovementType
  quantity: number
  reason: string | null
  createdAt: string
}

export interface InventoryDetail extends InventoryListItem {
  movements: InventoryMovementItem[]
}