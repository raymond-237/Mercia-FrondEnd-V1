import { defineStore } from "pinia";
import { notify } from "~/@cores/constantes/helpers";

/**
 * Store pour suivre les requêtes api emises par l'application via axios
 */
const useApiRequestStore = defineStore('apiRequestStore', {
    state: () => ({
      requestsInProgress: new Map<string, boolean>(),  // Stocke les requêtes en cours
      requestErrors: new Map<string, { status: number, message: string, details?: any }>(), // Stocke les erreurs
    }),
  
    actions: {
      
      // Marquer une requête comme en cours
      startRequest(requestId: string) {
        this.requestsInProgress.set(requestId, true);
      },
  
      // Marquer une requête comme terminée
      finishRequest(requestId: string) {
        this.requestsInProgress.delete(requestId);
      },

      // Enregistre une erreur (et affiche une notification)
      setErrorV2(requestId: string, errorData: { status: number; message: string; details?: any }) {
        this.requestErrors.set(requestId, errorData);

        console.error(`error[${requestId}] => `, errorData)

        // Affichage d'une notification d'erreur
        notify({
          title: 'Oups ...',
          description:  errorData.message ?? "Une erreur est survenue",
          icon: 'i-octicon-desktop-download-24',
          color : "red",
        });

        // Redirection conditionnelle en fonction du code d'erreur
        switch (errorData.status) {
          case 401:
            navigateTo('/auth/login');
            break;
          case 403:
            navigateTo("");
            break;
          case 302:
            navigateTo("", { replace: true });
            break;
        }

        // Suppression de l'erreur après 10 secondes
        setTimeout(() => this.requestErrors.delete(requestId), 10000);
      },


  
      // Vérifier si une requête est en cours
      isRequestInProgress(requestId: string): boolean {
        return this.requestsInProgress.has(requestId);
      },
  
      // Obtenir une erreur spécifique
      getError(requestId: string) {
        return this.requestErrors.get(requestId);
      },
  
      // Supprimer une erreur spécifique
      clearError(requestId: string) {
        this.requestErrors.delete(requestId);
      },
  
      // Tout réinitialiser
      reset() {
        this.requestsInProgress.clear();
        this.requestErrors.clear();
      },
    },
  });

export default useApiRequestStore;
