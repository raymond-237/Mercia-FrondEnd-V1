import axios from "axios";
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const { public: publicRuntimeConfig } = useRuntimeConfig();

  const instance = axios.create({
    baseURL: String(publicRuntimeConfig.API_BASE_URL) || "http://localhost:3800",
    method :  "get",
  });

  return {
    provide: {
      axios: instance,
    },
  };
});
