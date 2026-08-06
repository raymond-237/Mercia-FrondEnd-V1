import { Jsona } from 'jsona'
import type { TAnyKeyValueObject, TJsonApiBody } from 'jsona/lib/JsonaTypes'

const dataFormatter = new Jsona()

// ── camelCase → snake_case, récursif ─────────────────────────────────────
// Laravel attend du snake_case ; notre code JS/TS reste en camelCase.
// S'applique aux objets ET tableaux imbriqués (shippingAddress.addressLine1
// → shipping_address.address_line1, items[].productVariantId → product_variant_id).

function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

function snakeizeKeys(input: any): any {
  if (Array.isArray(input)) {
    return input.map(snakeizeKeys)
  }
  if (input !== null && typeof input === 'object' && !(input instanceof Date) && !(input instanceof File)) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [toSnake(key), snakeizeKeys(value)]),
    )
  }
  return input
}

/**
 * Sérialise un objet plat (form data) en document JSON:API pour un POST/PATCH.
 * Convertit récursivement toutes les clés en snake_case avant envoi.
 *
 * @param type  Type de ressource JSON:API (ex: PRODUCTS, ORDERS)
 * @param data  Objet plat contenant les attributs (et éventuellement id)
 */
// export function JsonaSerialize(type: string, data: TAnyKeyValueObject) {
//   const { id, ...attributes } = data as TAnyKeyValueObject & { id?: string }

//   return dataFormatter.serialize({
//     stuff: {
//       ...(id ? { id } : {}),
//           ...snakeizeKeys(attributes),
//       type,
//     },
//   })
// }

export function JsonaSerialize(type: string, data: TAnyKeyValueObject) {
  const { id, ...attributes } = data as TAnyKeyValueObject & { id?: string }

  return {
    data: {
      type,
      ...(id ? { id } : {}),
      attributes,
    },
  }
}

/**
 * Convertit récursivement un objet en snake_case, SANS enveloppe JSON:API
 * (pas de { data: { type, attributes } }). À utiliser pour les endpoints
 * custom qui attendent du JSON plat plutôt qu'un document JSON:API —
 * ex: POST /orders/checkout, qui passe par un FormRequest Laravel classique
 * et non par le pipeline JSON:API standard.
 */
export function toSnakeCase<T = any>(input: any): T {
  return snakeizeKeys(input)
}

/**
 * Désérialise une réponse JSON:API (single resource ou collection,
 * avec relationships résolues via `included`) en objet(s) JS plats.
 *
 * @param body  Le corps JSON:API brut (response.data d'Axios)
 */
export function JsonaDeserialize<T = any>(body: TJsonApiBody): T {
  return dataFormatter.deserialize(body) as T
}