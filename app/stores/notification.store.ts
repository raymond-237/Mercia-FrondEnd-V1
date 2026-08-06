import { defineStore } from "pinia";

type NotificationStoreType = {
    
}
export const useNotificationStore = defineStore('notification', {
    state : () => ({
        color : "error",
        message : null,
        timeout : 10000,
        visible : false,
        options : {}
    }),
    getters: {
        getNotification (state)  {
            return state;
        },

        isVisible (state)  {
            return state.visible;
        },
    },
    actions: {
        close(){
            this.visible = false;
        },
        show(){
            this.visible = true;
        },
        setNotification (config : any){
            this.message = config.message ?? "";
            this.color = config.color ?? "success";
            this.timeout = config.timeout ?? 10000;
            this.visible = config.visible ?? false;
            if ("options" in config){

            }

        },
    },
});
