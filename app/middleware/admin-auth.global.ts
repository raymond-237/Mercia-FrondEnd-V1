import { notify } from "~/@cores/constantes/helpers"

export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/backoffice')) return

  const { isAuthenticated } = useAuthentication()

  if (to.meta.auth === false) {
    if (isAuthenticated.value) {
      notify('Vous êtes déjà connecté.', 'info')
      return navigateTo('/backoffice')
    }
    return
  }

  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/backoffice/auth/login',
      query: to.fullPath !== '/backoffice' ? { redirect: to.fullPath } : undefined,
    })
  }
})