export interface TenantGeneral {
  name: string
  slug: string
  domain: string | null
  email: string
  phone: string | null
  currency: string
  currencySymbol: string
  locale: string
  status: string
  logoUrl: string | null
}

export interface TenantShop {
  addressLine1: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  whatsapp: string | null
}

export interface TenantPayment {
  paypalClientId: string | null
  paypalConfigured: boolean
  activeMethods: string[]
}

export interface TenantNotifications {
  orderConfirmation: boolean
  orderShipped: boolean
  orderDelivered: boolean
  lowStock: boolean
  newReturn: boolean
}

export interface TenantSettings extends TenantGeneral {
  shop: TenantShop
  payment: TenantPayment
  notifications: TenantNotifications
}

export interface GeneralFormData {
  name: string
  currency: string
  currencySymbol: string
  locale: string
}

export interface ShopFormData {
  email: string
  phone: string | null
  addressLine1: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  whatsapp: string | null
}

export interface PaymentFormData {
  paypalClientId: string | null
  paypalSecret: string | null
  activeMethods: string[]
}

export interface NotificationsFormData {
  orderConfirmation: boolean
  orderShipped: boolean
  orderDelivered: boolean
  lowStock: boolean
  newReturn: boolean
}

export interface ChangePasswordFormData {
  currentPassword: string
  newPassword: string
  newPassword_confirmation: string
}

export interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  createdAt: string
}

export interface HeroSlide {
  image: string | null
  eyebrow?: string
  title?: string
  subtitle?: string
  ctaLabel?: string
  ctaTo?: string
  ctaSecondaryLabel?: string
  ctaSecondaryTo?: string
  tone?: 'primary' | 'secondary'
  isActive?: boolean
}

export interface HeroSlideForm extends HeroSlide {
  id: string
  sourceType: 'upload' | 'url'
}

export interface HeroFormData {
  slides: HeroSlide[]
}

export interface PublicSettings {
  shopName: string | null
  logoUrl: string | null
  tagline: string | null
  socialLinks: {
    instagram: string | null
    whatsapp: string | null
    tiktok: string | null
  }
}