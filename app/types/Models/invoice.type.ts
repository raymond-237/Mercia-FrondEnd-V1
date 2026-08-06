export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface InvoiceData {
  id: string
  invoiceNumber: string
  status: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  issuedAt: string
  paidAt: string | null
  items: InvoiceItem[]
}