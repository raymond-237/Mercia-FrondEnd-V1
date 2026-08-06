import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import useApiRequestStore from "~/stores/api-request.store";
// import useCurrentOrganizationStore from "~/stores/current-organization.store";
import { v4 as uuidv4 } from "uuid";
import useAuthentication from "./useAuthentication";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  requestId?: string;
  required: {
    jsona: boolean;
  };
}

export default function axiosBuilder() {
  // const currentOrganizationStore = useCurrentOrganizationStore();
  const { public: publicRuntimeConfig } = useRuntimeConfig();

  // Accédez directement aux getters depuis le store
  // const COMPANY_ID = currentOrganizationStore?.COMPANY_ID;
  /**
   * axios setup to use mock service
   */

  const api: any = axios.create({
                    baseURL: `${publicRuntimeConfig.API_BASE_URL}`,
                    method: "get",
                  });

  /**
   * Se produit juste avant l'envoi de la requête
   */
  api.interceptors.request.use((config: CustomAxiosRequestConfig) => {
    //    const { locale } = useI18n();

    const apiRequestStore = useApiRequestStore();

    // Vérifie si un requestId existe déjà, sinon en génère un nouveau
    const requestId = config.headers["x-request-id"] ?? uuidv4();

    /**
     * Ajout des headers personnalisés
     */
    config.headers["X-Request-Id"] = requestId;
    config.headers["X-Request-At"] = new Date().toISOString();
    config.headers["X-Request-By"] = "web";

    // Marquer la requête comme en cours
    apiRequestStore.startRequest(requestId);

    // Stocker l'ID dans la config pour le récupérer plus tard
    config.requestId = requestId;

    const auth = config?.required?.auth ?? false;
    const jsona = config?.required?.jsona ?? true;

    if (jsona) {
      config.headers["Accept"] = "application/vnd.api+json";
      config.headers["Content-Type"] = "application/vnd.api+json";
    }

    if (!config.url?.includes("auth") || !config.url?.includes("configs")) {
      const { token } = useAuthentication();
      config.headers["Authorization"] = token.value;
    }

   

    return config;
  });

  /**
   *  Se produit juste après que le serveur distant a repondu
   */
  api.interceptors.response.use(
    (response: AxiosResponse) => {
      //  console.info(`api-response-before  -->`,response);

      const apiRequestStore = useApiRequestStore();

      const requestId =
        response.config && response.config.headers["X-Request-Id"];

      if (requestId) {
        apiRequestStore.finishRequest(requestId);

        if (response.status === 200) {
          apiRequestStore.clearError(requestId);
        }
      }
      return response;
    },
    (error: AxiosError) => {
      const apiRequestStore = useApiRequestStore();
      const response = error.response as AxiosResponse;

      const requestId =
        response && response.config && response.config.headers["X-Request-Id"];

      // console.log(`[${requestId}] api-response-error  -->`, response);

      if (requestId) {
        apiRequestStore.finishRequest(requestId);
        // apiRequestStore.setError(requestId, error);
      }
      // return error.response;
      // console.log(`[${requestId}] api-response-error  -->`, error);

           return Promise.reject(error);
    }
  );

  return {
    api,
  };
}
