import type { AxiosResponse } from "axios";

export type NavigationType = {
    label : string,
    link : string,
}

export type ApiFormProps = {
    processing? : boolean;
    errors? : any[]; 
}

// Définition des types d'événements (optionnel, mais recommandé)
export type EventsProps = {
    myEvent: string // Exemple d'événement avec une string
    anotherEvent: number // Un autre événement avec un nombre
}

export type RequestQueryType<T = {}> = {
    page?: {
      size?: number;
      number?: number;
    };
    filter?: T;
    include?: string;
    sort?: string;
}

export type  MetaPageType = {
    page: {
      "current-page": number;
      "per-page": number;
      from: number;
      to: number;
      total: number;
      "last-page": number;
    };
}

export type logoType = {
    light: string;
    dark : string
}

export type CurrentOrganizationConfigType= {
    id?: number,
    name?: string,
    slug?: string | null,
    google_tag_manager?: string | null,
    logo?: logoType | null,
    home_page_design?: HomePageDesigns | null, // 
    cover_image?: string | null, 
    home_page_url?: string | null,
    terms_and_conditions_url?: string | null,
    regulations_url?: string | null,

    settings ? : object;
}

export type ModalProps = {
    loader? : {
      loading? : boolean,
      text? : string,
    },
    open : boolean
}

export type PersistOptionsType = {
    enabled?: boolean;
    key?: string;
    storage?: typeof localStorage | typeof sessionStorage;
    paths?: string[];
}

export type NotificationModalOptionsType ={
    show : boolean;
    body? : string | null ;
    title? : string | null ;
    label? : string | null ;
}

export type FormStateType<T extends Record<string, any> = Record<string, any>> = {
    id : string;
    data : T;
    errors : Record<string, string[]>;
    processing : boolean | ComputedRef<boolean>;
    submit : (submitFn: () => Promise<AxiosResponse>) => Promise<AxiosResponse> | any;
    clear : () => void;
    validate : () => Promise<boolean>;
    validateField : (field: keyof T) => Promise<any>;
    
    // 🔹 Assure que resetForm accepte un objet partiel du type T.
    reset : (initialData?: Partial<T> ) => void;
    normalizedData : ( )=> any,
    isValid : boolean | ComputedRef<boolean>;
    isInValid :  ComputedRef<boolean> | boolean;
};




export type ServiceProps = {
    create?: (payload : any) => AxiosResponse;
    update?: (model : any, payload : any) => AxiosResponse;
    archive?: (model : any, payload : any) => AxiosResponse;
    delete?: (model : any, payload : any) => AxiosResponse;

    find?: (model : any) => AxiosResponse;
    all?: (query : any) => AxiosResponse;
    
    createMany?: (payload : any) => AxiosResponse;
    updateMany?: (payload : any) => AxiosResponse;
    archiveMany?: (payload : any) => AxiosResponse;
    deleteMany?: (payload : any) => AxiosResponse;
};


