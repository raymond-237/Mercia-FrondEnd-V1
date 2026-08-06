import type { AxiosResponse } from 'axios'
import { request } from '~/@cores/constantes/helpers'
import { JsonaDeserialize, JsonaSerialize } from '~/@cores/jsonabuilder'
import { CATEGORIES } from '~/@cores/constantes/apiresource'
import type { CategoryData } from '~/types/public/index.type'
import type { CategoryFormData } from '~/types/Models/category.type'

/**
 * parentId ne peut jamais être un attribut JSON:API plat — c'est une
 * relation vers une autre Category (self-référentielle via parent_id).
 * On l'extrait du payload avant sérialisation, puis on la reconstruit
 * manuellement dans data.relationships.parent — même principe que
 * category/supplier extraits manuellement côté ProductController.
 */
function buildCategoryDocument(payload: CategoryFormData) {
  const { parentId, ...attributes } = payload as CategoryFormData & { parentId?: string | null }

  const data = JsonaSerialize(CATEGORIES, attributes) as any

  data.data.relationships = {
    ...(data.data.relationships ?? {}),
    parent: {
      data: parentId ? { type: CATEGORIES, id: parentId } : null,
    },
  }

  return data
}

export default function useCategoriesService() {

  /**
   * GET /api/v1/categories
   */
  const list = async (): Promise<CategoryData[]> => {
    const response: AxiosResponse = await request('categories')
    return JsonaDeserialize<CategoryData[]>(response.data)
  }

  /**
   * GET /api/v1/categories/{category}
   */
  const show = async (idOrSlug: string): Promise<CategoryData> => {
    const response: AxiosResponse = await request(`categories/${idOrSlug}`)
    return JsonaDeserialize<CategoryData>(response.data)
  }

  /**
   * POST /api/v1/categories
   * Route JSON:API standard — attributs en camelCase, pas de snake_case
   * (contrairement aux endpoints custom comme orders/checkout).
   * parentId part dans data.relationships.parent, jamais en attribut.
   */
  const create = async (payload: CategoryFormData) => {
    const data = buildCategoryDocument(payload)
    const response: AxiosResponse = await request('categories', {
      method: 'post',
      data,
    })
    return JsonaDeserialize(response.data)
  }

  /**
   * PATCH /api/v1/categories/{id}
   */
  const update = async (id: string, payload: CategoryFormData) => {
    const data = buildCategoryDocument(payload)
    data.data.id = id
    const response: AxiosResponse = await request(`categories/${id}`, {
      method: 'patch',
      data,
    })
    return JsonaDeserialize(response.data)
  }

  /**
   * DELETE /api/v1/categories/{id}
   */
  const remove = async (id: string): Promise<void> => {
    await request(`categories/${id}`, { method: 'delete' })
  }

  return {
    list,
    show,
    create,
    update,
    remove,
  }
}