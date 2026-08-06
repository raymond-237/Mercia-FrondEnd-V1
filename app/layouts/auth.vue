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
    <div class="auth-page">
      <div class="auth-card">
        <slot />
      </div>
    </div>
  </v-app>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');
</style>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-background));
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: rgb(var(--v-theme-surface));
  border-radius: var(--r-2xl);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
  padding: 40px 32px;
}

@media (max-width: 480px) {
  .auth-page { padding: 0; }
  .auth-card { max-width: none; min-height: 100vh; border-radius: 0; box-shadow: none; display: flex; flex-direction: column; justify-content: center; }
}
</style>