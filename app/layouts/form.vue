<script setup lang="ts">

import { useStorefront } from '~/composables/useStorefront'
import { useTheme } from 'vuetify'

const sf = useStorefront()

// Sync thème Vuetify avec l'état du composable
const theme = useTheme()
watch(sf.isDark, (val) => {
  theme.global.name.value = val ? 'dark' : 'light'
}, { immediate: true })
</script>

<template>
  <v-app>
    <div class="page-bg">
      <div class="shell">

        <LayoutsNavbar />

        <!-- Contenu centré verticalement — visible sans scroll au chargement -->
        <main class="form-main">
          <slot />
        </main>

        <LayoutsFooter />
      </div>

      <!-- Drawers montés UNE SEULE FOIS — jamais dans <Teleport> à ce niveau -->
      <LayoutsDrawerCart />
      <LayoutsBodyStickyCartBar />
    </div>
  </v-app>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');
</style>

<style scoped>
/* ── Mobile first  */
.page-bg {
  min-height: 100dvh;
  background: rgb(var(--v-theme-background));
  padding: 0;
}

.shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  margin: 0 auto;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.form-main {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 0;
}

/* ── Desktop  */
@media (min-width: 960px) {
  .page-bg { padding: 28px; }

  .shell {
    min-height: calc(100dvh - 56px);
    border-radius: var(--r-2xl);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  }

  .form-main { padding: 40px; }
}
</style>