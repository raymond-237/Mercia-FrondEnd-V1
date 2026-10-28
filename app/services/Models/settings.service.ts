import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import type {
  TenantSettings,
  GeneralFormData,
  ShopFormData,
  PaymentFormData,
  NotificationsFormData,
  ChangePasswordFormData,
  TeamMember,
  HeroFormData,
  HeroSlide,
  PublicSettings,
} from '~/types/Models/settings.type'

export default function useSettingsService() {

  const get = async (): Promise<TenantSettings> => {
    const response: AxiosResponse = await request('tenant', { method: 'get' })
    return response.data?.data
  }

  const updateGeneral = async (payload: GeneralFormData) => {
    const response: AxiosResponse = await request('tenant/general', { method: 'patch', data: payload })
    return response.data?.data
  }

  const updateShop = async (payload: ShopFormData) => {
    const response: AxiosResponse = await request('tenant/shop', { method: 'patch', data: payload })
    return response.data?.data
  }

  const updatePayment = async (payload: PaymentFormData) => {
    const response: AxiosResponse = await request('tenant/payment', { method: 'patch', data: payload })
    return response.data?.data
  }

  const updateNotifications = async (payload: NotificationsFormData) => {
    const response: AxiosResponse = await request('tenant/notifications', { method: 'patch', data: payload })
    return response.data?.data
  }

  const uploadLogo = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('logo', file)
    const response: AxiosResponse = await request('tenant/logo', {
      method: 'post',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data?.data?.logoUrl
  }

  // ── Hero carousel 
  const updateHeroSlides = async (payload: HeroFormData): Promise<{ slides: HeroSlide[] }> => {
    const response: AxiosResponse = await request('backoffice/settings/hero-slides',
      {
        method: 'put',
        data: payload
      })
    return response.data?.data
  }

  const uploadHeroImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)
    const response: AxiosResponse = await request('backoffice/settings/hero-slides/upload', {
      method: 'post',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data?.data?.url
  }

  const changePassword = async (payload: ChangePasswordFormData) => {
    const response: AxiosResponse = await request('auth/password/change', { method: 'post', data: payload })
    return response.data?.data
  }

  const toggle2fa = async (): Promise<{ is2faEnabled: boolean }> => {
    const response: AxiosResponse = await request('auth/2fa/toggle', { method: 'post' })
    return response.data?.data
  }

  const fetchTeam = async (): Promise<TeamMember[]> => {
    const response: AxiosResponse = await request('team', { method: 'get' })
    return response.data?.data ?? []
  }

    const fetchHero = async (): Promise<HeroFormData[]> => {
    const response: AxiosResponse = await request('hero-slides', { method: 'get' })
    return response.data?.data ?? []
  }

     const publicSetting = async (): Promise<PublicSettings[]> => {
    const response: AxiosResponse = await request('settings/public', { method: 'get' })
    return response.data?.data ?? []
  }

  return {
    get, updateGeneral, updateShop, updatePayment, updateNotifications, uploadLogo,
    updateHeroSlides, uploadHeroImage,
    changePassword, toggle2fa, fetchTeam,fetchHero,publicSetting
  }
}