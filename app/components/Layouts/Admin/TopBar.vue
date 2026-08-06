<script setup lang="ts">
const search = ref('')
const mobileNavOpen = ref(false)
const profileMenuOpen = ref(false)

const { sidebarCollapsed, toggleSidebar } = useAdminUI()
const sf = useStorefront()
const router = useRouter()
const { signOut,user } = useAuthentication()


// TODO Module suivant : remplacer par le vrai user connecté (auth admin)
const currentUser = computed(() => {
  const attrs = user.value?.data?.attributes
  return {
    name: attrs ? `${attrs.firstName} ${attrs.lastName}` : 'Utilisateur',
    email: attrs?.email ?? '',
    avatarUrl: attrs?.avatarUrl ?? null,
  }
})

const loggingOut = ref(false)
async function onLogout() {
  loggingOut.value = true
  try {
    await signOut({ callbackUrl: '/backoffice/auth/login', redirect: true })
  } catch (e) {
    console.error('Erreur déconnexion:', e)
    loggingOut.value = false
  }
}

defineExpose({ mobileNavOpen })
</script>

<template>
  <header class="topbar">

    <v-btn icon variant="tonal" color="primary" size="42" class="hide-desktop" @click="mobileNavOpen = true">
      <Icon icon="solar:hamburger-menu-line-duotone" width="20" />
    </v-btn>

    <v-btn
      icon variant="tonal" color="secondary" size="42" class="hide-mobile"
      @click="toggleSidebar"
    >
      <Icon icon="solar:sidebar-minimalistic-line-duotone" width="20" />
    </v-btn>

    <v-text-field
      v-model="search"
      variant="solo-filled"
      density="compact"
      flat
      hide-details
      placeholder="Rechercher..."
      class="topbar-search"
    >
      <template #prepend-inner>
        <Icon icon="solar:magnifer-line-duotone" width="18" />
      </template>
    </v-text-field>

    <div class="topbar-actions">

      <v-btn icon variant="tonal" color="primary" size="42" @click="sf.toggleTheme()">
        <Icon :icon="sf.isDark.value ? 'solar:sun-2-line-duotone' : 'solar:moon-stars-line-duotone'" width="19" />
      </v-btn>

      <LayoutsNotification />

      <!-- Profil -->
      <v-menu location="bottom end" offset="10">
        <template #activator="{ props }">
          <button class="user-trigger" v-bind="props">
            <div class="user-avatar">
              <img v-if="currentUser.avatarUrl" :src="currentUser.avatarUrl" :alt="currentUser.name">
              <Icon v-else icon="solar:user-line-duotone" width="25" />
            </div>
            <Icon icon="solar:alt-arrow-down-line-duotone" width="14" class="hide-mobile" />
          </button>
        </template>

        <div class="user-popover">
          <div class="user-popover-head">
            <div class="user-avatar lg">
              <img v-if="currentUser.avatarUrl" :src="currentUser.avatarUrl" :alt="currentUser.name">
              <Icon v-else icon="solar:user-line-duotone" width="24" />
            </div>
            <div>
              <div class="user-name">{{ currentUser.name }}</div>
              <div class="user-email">{{ currentUser.email }}</div>
            </div>
          </div>
          <v-divider class="my-2" />
          <button class="popover-item" @click="router.push('/backoffice/settings/profile')">
            <Icon icon="solar:user-circle-line-duotone" width="22" />
            Mon profil
          </button>
          <button class="popover-item" @click="router.push('/backoffice/settings')">
            <Icon icon="solar:settings-line-duotone" width="22" />
            Paramètres
          </button>
          <v-divider class="my-2" />
            <UiLogoutBtn>
                  <template #action="{ logout }">
                    <button class="popover-item danger" @click="logout">
                      <Icon icon="solar:logout-3-line-duotone" width="22" />
                      Déconnexion
                    </button>
                  </template>
            </UiLogoutBtn>
          <!-- <button class="popover-item danger" :disabled="loggingOut" @click="onLogout">
            <Icon icon="solar:logout-3-line-duotone" width="22" />
            {{ loggingOut ? 'Déconnexion...' : 'Déconnexion' }}
          </button> -->
        </div>
      </v-menu>

    </div>

  </header>

  <v-navigation-drawer
    v-model="mobileNavOpen"
    temporary
    location="left"
    width="280"
    class="mobile-nav-drawer"
  >
    <LayoutsAdminSidebar @navigate="mobileNavOpen = false" />
  </v-navigation-drawer>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.hide-desktop { display: none; }

.topbar-search { max-width: 420px; flex: 1; }
.topbar-search :deep(.v-field) { border-radius: var(--r-full); }

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--r-full);
  transition: background .2s;
}
.user-trigger:hover { background: rgb(var(--v-theme-surface-variant)); }

.user-avatar {
  width: 45px; height: 45px; border-radius: var(--r-xl);
  background: rgb(var(--v-theme-surface-variant));
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary));
  overflow: hidden; flex-shrink: 0;
}
.user-avatar.lg { width: 44px; height: 44px; }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

.user-popover {
  background: rgb(var(--v-theme-surface));
  border-radius: var(--r-lg);
  padding: 14px;
  min-width: 240px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}
.user-popover-head { display: flex; align-items: center; gap: 12px; padding: 4px; }
.user-name { font-size: 13.5px; font-weight: 700; }
.user-email { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.popover-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 8px;
  border-radius: var(--r-md);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  text-align: left;
  transition: background .2s;
}
.popover-item:hover { background: rgb(var(--v-theme-surface-variant)); }
.popover-item:disabled { opacity: 0.6; cursor: not-allowed; }
.popover-item.danger { color: #C0533E; }
.popover-item.danger:hover { background: rgba(192, 83, 62, 0.08); }

@media (max-width: 960px) {
  .topbar { padding: 14px 16px; gap: 8px; }
  .hide-desktop { display: flex; flex-shrink: 0; }
  .hide-mobile  { display: none; }
  .topbar-search { max-width: none; }
}
</style>