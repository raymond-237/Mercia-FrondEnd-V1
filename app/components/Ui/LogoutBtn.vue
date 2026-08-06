<script setup lang="ts">
import { notify } from "~/@cores/constantes/helpers";

const loading = ref<boolean>(false);
const confirm = ref<boolean>(false);

const { isAuthenticated, signOut } = useAuthentication();

const slots = useSlots();

async function logout() {
  try {
    loading.value = true;

    const response = await signOut({
      redirect: true,
      // callbackUrl: "backoffice/auth/login",
    });

    if (!isAuthenticated.value) {
      notify({
        message: "Déconnexion réussie",
        color: "success",
        timeout:2000
      });
      await navigateTo("backoffice/auth/login");
    } else {
      notify({
        message: "Impossible de vous déconnecter. Veuillez réessayer.",
        color: "error",
        timeout:2000
      });
    }
  } catch (error) {
    notify({
      message: "Erreur lors de la déconnexion",
      color: "error",
    });
  } finally {
    confirm.value = false;
    loading.value = false;
    
  }
}

function openConfirm() {
  confirm.value = true;
}
</script>

<template>
  <div>
    <ui-confirm-dialog v-model="confirm" @on-confirm="logout">
      <template v-slot:body>
        <p class="mb-0 font-weight-bold">Voulez-vous vous déconnecter ?</p>
      </template>

      <template v-slot:no-button>
        <v-btn
            color="secondary"
            height="40"
            rounded
            variant="outlined"
            class="text-transform-none text-white"
            :disabled="loading"
            @click="confirm = false"
        >
          Non
        </v-btn>
      </template>

      <template v-slot:yes-button>
        <v-btn
            color="secondary"
            height="40"
            rounded
            class="text-transform-none text-white"
            variant="elevated"
            :disabled="loading"
            :loading="loading"
            @click="logout"
        >
          Oui
        </v-btn>
      </template>
    </ui-confirm-dialog>

    <!-- Slot avec l'action logout -->
    <slot name="action" :logout="openConfirm">
      <!-- Bouton par défaut -->
      <v-btn
          variant="tonal"
          block
          rounded
          size="large"
          color="primary"
          class="font-weight-medium"
          @click="openConfirm"
      >
        <Logout2Icon class="mr-1 " stroke-width="1.5" size="26" />
        Déconnexion
      </v-btn>
    </slot>
  </div>
</template>