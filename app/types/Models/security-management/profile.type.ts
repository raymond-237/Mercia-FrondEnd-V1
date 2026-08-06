export interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  locale: string
  theme: 'light' | 'dark' | 'auto'
  avatarUrl: string | null
}

export interface ProfileFormData {
  firstName: string
  lastName: string
  phone: string | null
  locale: string
  theme: 'light' | 'dark' | 'auto'
}