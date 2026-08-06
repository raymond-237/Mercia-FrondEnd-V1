import type { AxiosResponse } from "axios";

export const isEmpty = (value : any) => blank(value);

export const blank = (value : any) => {
    if (value === null || value === undefined || value === '')  return true;
    return (Array.isArray(value) && value.length === 0);
};

export const filled = (value : any) => !blank(value);

export const isNullOrUndefined = (value: null | undefined) =>  (value === null || value === undefined);

export const isEmptyArray = (arr : any) => (Array.isArray(arr) && arr.length === 0);

export const isObject = (obj : any) => obj !== null && !!obj && typeof obj === 'object' && !Array.isArray(obj);

export const isArray = (arr : any) => arr !== null && !!arr && Array.isArray(arr);

export const removeUndefined = (arr : any) => filled(arr) ? arr.filter((v: any) => v !== undefined) : [];

const kFormatter = (num : any) =>{
    const formatter = Intl.NumberFormat('en', { notation: 'compact' });
    return formatter.format(num)
}


/**
 * Retourne la valeur d'une variable d'environnement
 * @param key
 * @param defaultValue
 * @returns
 */
export const env = (key : string,defaultValue : any = null) => {
    //const config = useRuntimeConfig();
    //return config.public[key] ?? defaultValue;
};

/**
 * Notifie le frontend en passant par le store (notificationStore)
 * @param options
 * @param color
 * @param config
 */
export const notify = (options : any,color : string ='default' ,config : any = {}) => {
    const useNotification = useNotificationStore();

    if(typeof options === 'string'){
        config.message = options;
        config.color = color;
    }
    if(typeof options === 'object'){
       config = {...options} ;
    }
    useNotification.setNotification(config);

    return  useNotification.show();
};

export const sleep = (time : number, message : string = 'Reprise dans : ') : any => {
    if  (filled(message)){
        console.log(message+time/1000+"s")
    }
    return new Promise((resolve) => setTimeout(resolve, time));
}

export const formatNumber = (number : number, options = {separator : " ",currency : ""} )=> {
    const { currency,separator } = options;
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)+currency;
}

export const getIdForRequest = (model : any,primaryKey : string = "id"): number | string => {
    return isObject(model) ? model[primaryKey] : model;
}

export const request = async (uri : string, options : any = {}) : Promise<AxiosResponse> => {
    options.url = uri;
        
    const {api} = axiosBuilder() as any
    return await api.request(options);
}

// export const formState = (key : string) : any => {
//     const {forms} = useApiResponseErrorStore() as any;
//     return forms[key] ?? { processing : false};
// }

// export const notifyToModal = (options: NotificationModalOptionsType) => {
//     const notificationStore = notificationModalStore();
//     notificationStore.setModal(options);
// };


