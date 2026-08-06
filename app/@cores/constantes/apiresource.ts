/**
 * Types de ressources JSON:API — miroir exact de ApiResource (PHP, backend).
 * Utilisés avec JsonaSerialize/JsonaDeserialize pour identifier le `type`
 * de chaque payload/réponse JSON:API. Les valeurs (strings) DOIVENT
 * correspondre aux types déclarés dans les Schema::type() côté Laravel.
 *
 * Convention : nom de constante au pluriel, identique à ApiResource::XXX
 * côté PHP, pour éviter toute confusion entre les deux stacks.
 */

// ── Catalogue 
export const CATEGORIES            = 'categories'
export const PRODUCTS              = 'products'
export const PRODUCT_VARIANTS      = 'productVariants'
export const PRODUCT_OPTION_TYPES  = 'productOptionTypes'
export const PRODUCT_OPTION_VALUES = 'productOptionValues'
export const MEDIAS                = 'medias'

// ── Stock 
export const INVENTORIES          = 'inventories'
export const INVENTORY_MOVEMENTS  = 'inventoryMovements'

// ── Ventes / Commandes 
export const ORDERS             = 'orders'
export const RETURN_REQUESTS    = 'returnRequests'
export const SHIPPING_METHODS   = 'shippingMethods'
export const SHIPPING_ZONES     = 'shippingZones'
export const TAX_RATES = 'taxRates'
export const DISCOUNT_CODES   = 'discountCodes'


// ── Sécurité / Multi-tenant 
export const USERS   = 'users'
export const TENANTS = 'tenants'
export const SUPPLIERS = 'suppliers'
