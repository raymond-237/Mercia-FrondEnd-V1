import type { SessionData } from "#auth";
import type { UserModel } from "~/types/Models/security-management/membership.type";


export default function useAuthentication() {
  const auth = useAuth();
  const { status, data, token, signIn, signUp,signOut } = auth;
  const runtimeConfig = useRuntimeConfig();

  let user = computed(() => data.value as UserModel);

  const isAuthenticated = computed(() => status.value === "authenticated");


  return {
    isAuthenticated,
    token,
    signIn,
    signUp,
    signOut,
    // getSession: getSessionCustom,
    user,
  };
}