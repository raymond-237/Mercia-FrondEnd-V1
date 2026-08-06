export interface TaxRateListItem {
  id: string
  name: string
  rate: number
  countryCode: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

export interface TaxRateFormData {
  name: string
  rate: number | null
  countryCode: string | null
  isDefault: boolean
  isActive: boolean
}