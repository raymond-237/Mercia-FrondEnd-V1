<script setup lang="ts">
import { useTheme } from 'vuetify'

const sf = useStorefront()
const route = useRoute()

// La fiche produit a déjà son propre CTA sticky (ajout au panier +
// prix), donc on masque la barre panier globale pour éviter le
// chevauchement des deux barres fixées en bas d'écran.
const hideCartStickyBar = computed(() => route.name === 'shop-slug')

// Sync thème Vuetify avec l'état du composable — useTheme(), pas $vuetify
const theme = useTheme()
watch(sf.isDark, (val) => {
  theme.global.name.value = val ? 'dark' : 'light'
}, { immediate: true })
</script>

<template>
  <v-app>
    <div class="page-bg">
      <div class="shell">
        <slot />
      </div>

      <!-- Drawers et overlays montés UNE SEULE FOIS — jamais dans <Teleport> à ce niveau -->
      <LayoutsDrawerCart />
      <LayoutsBodyStickyCartBar v-if="!hideCartStickyBar" />
      <LayoutsDrawerFilter />
      <LayoutsToastContainer />
    </div>
  </v-app>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --r-sm:   8px;
  --r-md:   16px;
  --r-lg:   22px;
  --r-xl:   28px;
  --r-2xl:  36px;
  --r-full: 50px;
}

* { box-sizing: border-box; }

body {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.font-display { font-family: 'Fraunces', serif; }

.v-btn {
  transition: transform .1s ease, background-color .15s ease !important;
  overflow: hidden;
}
.v-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 60%
  );
  transform: translateX(-100%);
  transition: none;
  pointer-events: none;
}
.v-btn:active {
  transform: scale(0.97) !important;
}
.v-btn:active::after {
  transform: translateX(100%);
  transition: transform .4s ease;
}
</style>

<style scoped>
.page-bg {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  padding: 28px;
}

.shell {
  margin: 0 auto;
  background: rgb(var(--v-theme-surface));
  border-radius: var(--r-2xl);
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

@media (max-width: 768px) {
  .page-bg {
    padding: 0;
  }
  .shell {
    border-radius: 0;
    box-shadow: none;
  }
}
</style>