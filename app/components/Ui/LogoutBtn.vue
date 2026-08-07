<script setup lang="ts">
import { notify } from "~/@cores/constantes/helpers";

const loading = ref<boolean>(false);
const confirm = ref<boolean>(false);

const { signOut } = useAuthentication();

async function logout() {
  loading.value = true;
  try {

    await signOut({ redirect: false });

    notify({
      message: "Déconnexion réussie",
      color: "success",
      timeout: 2000,
    });

    await navigateTo("/backoffice/auth/login", { external: true });
  } catch (error) {
    notify({
      message: "Erreur lors de la déconnexion",
      color: "error",
      timeout: 3000,
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
        <Icon icon="solar:logout-3-line-duotone" width="22" style="margin-right: 6px;" />
        Déconnexion
      </v-btn>
    </slot>
  </div>
</template>