import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import type { ProfileData, ProfileFormData } from '~/types/Models/security-management/profile.type'

export default function useProfileService() {

  const get = async (): Promise<ProfileData> => {
    const response: AxiosResponse = await request('profile', { method: 'get' })
    return response.data?.data
  }

  const update = async (payload: ProfileFormData) => {
    const response: AxiosResponse = await request('profile', { method: 'patch', data: payload })
    return response.data?.data
  }

  const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response: AxiosResponse = await request('profile/avatar', {
      method: 'post',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data?.data?.avatarUrl
  }

  return { get, update, uploadAvatar }
}