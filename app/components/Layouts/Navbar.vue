<script setup lang="ts">

const sf = useStorefront()

const searchOpen = ref(false)
const searchQuery = ref('')

function onSearch() {
  if (!searchQuery.value.trim()) return
  searchOpen.value = false
  navigateTo({ path: '/shop', query: { q: searchQuery.value } })
}
</script>

<template>
  <header class="navbar">

    <!-- Logo — composant dédié -->
    <LayoutsLogo />

    <!-- Search pill — desktop — v-text-field natif Vuetify -->
    <v-text-field
      v-model="searchQuery"
      variant="solo-filled"
      density="compact"
      flat
      hide-details
      placeholder="Rechercher..."
      class="nav-search"
      @keyup.enter="onSearch"
    >
      <template #prepend-inner>
        <Icon icon="solar:magnifer-line-duotone" width="18" />
      </template>
    </v-text-field>

    <!-- Actions -->
    <div class="nav-actions">

      <!-- Langue — v-btn-toggle natif Vuetify -->
      <!-- <v-btn-toggle
        :model-value="sf.locale.value"
        color="primary"
        density="compact"
        mandatory
        rounded="pill"
        class="lang-toggle"
        @update:model-value="(val) => sf.setLocale(val)"
      >
        <v-btn value="fr" size="small">FR</v-btn>
        <v-btn value="it" size="small">IT</v-btn>
          <v-btn value="it" size="small">EN</v-btn>

      </v-btn-toggle> -->
      <UiLangSwitcher />

      <!-- Thème -->
      <v-btn
        icon
        variant="tonal"
        size="40"
        @click="sf.toggleTheme()"
      >
        <Icon
          :icon="sf.isDark.value ? 'solar:sun-2-line-duotone' : 'solar:moon-stars-line-duotone'"
          width="20"
        />
      </v-btn>

      <!-- Search mobile -->
      <v-btn
        icon
        variant="tonal"
        size="40"
        class="hide-desktop"
        @click="searchOpen = true"
      >
        <Icon icon="solar:magnifer-line-duotone" width="20" />
      </v-btn>

      <!-- Suivi commande -->
      <v-btn
        icon
        variant="tonal"
        size="40"
        class="hide-mobile"
        :to="'/tracking'"
      >
        <Icon icon="solar:delivery-line-duotone" width="20" />
      </v-btn>

      <!-- Panier — v-badge natif Vuetify pour le compteur -->
      <v-badge
        :content="sf.cartCount.value"
        :model-value="sf.cartCount.value > 0"
        color="secondary"
        offset-x="6"
        offset-y="6"
      >
        <v-btn
          icon
          variant="tonal"
          size="40"
          @click="sf.openCart()"
        >
          <Icon icon="solar:bag-4-line-duotone" width="20" />
        </v-btn>
      </v-badge>

    </div>

    <!-- Search overlay mobile -->
    <Teleport to="body">
      <Transition name="search-overlay">
        <div v-if="searchOpen" class="search-overlay" @click.self="searchOpen = false">
          <v-text-field
            v-model="searchQuery"
            variant="solo-filled"
            flat
            hide-details
            autofocus
            placeholder="Rechercher une texture, une longueur..."
            class="search-overlay-field"
            @keyup.enter="onSearch"
          >
            <template #prepend-inner>
              <Icon icon="solar:magnifer-line-duotone" width="20" />
            </template>
            <template #append-inner>
              <v-btn
                icon
                variant="text"
                size="32"
                @click="searchOpen = false"
              >
                <Icon icon="solar:close-circle-line-duotone" width="20" />
              </v-btn>
            </template>
          </v-text-field>
        </div>
      </Transition>
    </Teleport>

  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
}

/* Search desktop */
.nav-search {
  flex: 1;
  max-width: 360px;
}
.nav-search :deep(.v-field) {
  border-radius: 50px;
}

/* Actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

/* Lang toggle */
.lang-toggle {
  height: 40px !important;
}
.lang-toggle :deep(.v-btn) {
  font-size: 11px;
  font-weight: 700;
  min-width: 40px;
}

/* Search overlay mobile */
.search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 300;
  display: flex;
  align-items: flex-start;
  padding: 16px;
}
.search-overlay-field {
  width: 100%;
}
.search-overlay-field :deep(.v-field) {
  border-radius: var(--r-xl);
}

.search-overlay-enter-active,
.search-overlay-leave-active { transition: opacity .2s; }
.search-overlay-enter-from,
.search-overlay-leave-to { opacity: 0; }

/* Responsive */
.hide-desktop { display: none; }
.hide-mobile  { display: flex; }

@media (max-width: 768px) {
  .navbar { padding: 16px; gap: 8px; }
  .nav-search { display: none; }
  .hide-desktop { display: flex; }
  .hide-mobile  { display: none; }

  .lang-toggle { height: 36px !important; }
  .lang-toggle :deep(.v-btn) { min-width: 34px; font-size: 10px; }
}

@media (max-width: 380px) {
  .nav-actions { gap: 4px; }
}
</style>