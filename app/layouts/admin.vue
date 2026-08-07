<script setup lang="ts">
import { useTheme } from 'vuetify'

const sf = useStorefront()

const theme = useTheme()
watch(sf.isDark, (val) => {
  const preferred = val ? 'darkTheme' : 'lightTheme'
  const fallback  = val ? 'dark' : 'light'
  const target = theme.themes.value[preferred] ? preferred : fallback
  if (theme.themes.value[target]) theme.global.name.value = target
}, { immediate: true })
</script>

<template>
  <v-app>
    <div class="admin-page-bg">
      <div class="admin-shell">
        <div class="desktop-sidebar">
          <LayoutsAdminSidebar />
        </div>
        <div class="admin-main">
          <LayoutsAdminTopBar />
          <main class="admin-content">
            <slot />
          </main>
        </div>
      </div>
    </div>
  </v-app>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');
</style>

<style scoped>
.admin-page-bg {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  padding: 15px;
}

.admin-shell {
  max-width: 1600px;
  margin: 0 auto;
  min-height: calc(100vh - 40px);
  background: rgb(var(--v-theme-surface));
  border-radius: var(--r-2xl);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
}

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: rgba(var(--v-theme-on-surface), 0.015);
}

.admin-content {
  flex: 1;
  padding: 22px;
  overflow-y: auto;
}

.desktop-sidebar {
  display: flex;
  align-self: stretch;
}

@media (max-width: 960px) {
  .admin-page-bg { padding: 0; }
  .admin-shell { border-radius: 0; min-height: 100vh; }
  .admin-content { padding: 16px; }
  .desktop-sidebar { display: none; }
}
</style>