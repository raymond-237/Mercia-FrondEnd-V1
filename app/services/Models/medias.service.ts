import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize } from '~/@cores/jsonabuilder'

export interface UploadedMedia {
  id: string
  url: string
}

export default function useMediasService() {

  /**
   * POST /api/v1/medias/upload
   * multipart/form-data — on désactive le flag "jsona" de l'intercepteur
   * axios pour ne pas forcer Content-Type: application/vnd.api+json,
   * qui casserait l'upload multipart (axios doit poser son propre
   * boundary automatiquement).
   */
  const uploadTemporary = async (file: File): Promise<UploadedMedia> => {
    const formData = new FormData()
    formData.append('file', file)

    const response: AxiosResponse = await request('medias/upload', {
      method: 'post',
      data: formData,
      required: { jsona: false },
    })

    return JsonaDeserialize<UploadedMedia>(response.data)
  }

  /**
   * DELETE /api/v1/medias/{media}
   */
  const remove = async (id: string): Promise<void> => {
    await request(`medias/${id}`, { method: 'delete' })
  }

  return {
    uploadTemporary,
    remove,
  }
}