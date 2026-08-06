
export const defaultModalValue : ModalProps = {
      open : false,
      loader : {
        loading : false,
        text : `Chargement...`,
    },

}


export enum HomePageDesigns {
    HOME_PAGE_1 = "HOME_PAGE_1",
    HOME_PAGE_2 = "HOME_PAGE_2",
    HOME_PAGE_3 = "HOME_PAGE_3",
}

export enum LoaderAreas {
    BODY = "BODY",
    SLOT = "SLOT",
}

/**
 * Action pour Serialize
 */


export const TIPSTER_APPLICATION = "tipsterApplication"

/**
 * Actions disponibles pour les opérations CRUD
 */
export const ACTION_CREATE = 'create';
export const ACTION_UPDATE = 'update';
export const ACTION_VIEW = 'view';
export const ACTION_IMPORT = 'import';
export const ACTION_FILTER = 'filter';
export const ACTION_EXPORT = 'export';

export type CrudAction =
    | typeof ACTION_CREATE
    | typeof ACTION_UPDATE
    | typeof ACTION_VIEW
    | typeof ACTION_IMPORT
    | typeof ACTION_EXPORT
    | typeof ACTION_FILTER;

/**
 * Types de vues disponibles pour l'affichage des données
 */
export const VIEW_TYPE_TABLE = 'table';
export const VIEW_TYPE_CARD = 'card';

export type ViewType = typeof VIEW_TYPE_TABLE | typeof VIEW_TYPE_CARD;

/**
 * Configuration par défaut pour la pagination
 */
export const DEFAULT_PAGE_SIZE = 15;
export const DEFAULT_PAGE = 1;
export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100];

/**
 * Orientations disponibles pour les offcanvas
 */
export const OFFCANVAS_ORIENTATION = {
    LEFT: 'left',
    RIGHT: 'right',
    TOP: 'top',
    BOTTOM: 'bottom',
} as const;

/**
 * Tailles disponibles pour les offcanvas
 */
export const OFFCANVAS_SIZE = {
    SM: 'sm',
    MD: 'md',
    LG: 'lg',
    XL: 'xl',
    FULL: 'full',
} as const;

/**
 * Mapping des tailles d'offcanvas en pixels/pourcentages
 */
export const OFFCANVAS_SIZE_MAP = {
    sm: '400',
    md: '600',
    lg: '800',
    xl: '1000',
    full: '100%',
} as const;

/**
 * Durées de transition par défaut
 */
export const TRANSITION_DURATION = {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
} as const;

/**
 * Status de requête
 */
export const REQUEST_STATUS = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error',
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

// export const imagePlaceHolder = defaultImage;