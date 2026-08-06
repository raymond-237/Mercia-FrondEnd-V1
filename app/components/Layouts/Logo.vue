<script setup lang="ts">
withDefaults(
  defineProps<{ showText?: boolean; size?: number }>(),
  { showText: false, size: 42 }
)
</script>

<template>
  <NuxtLink to="/" class="brand-logo">
    <img
      src="~/assets/images/afro-extension-logo.png"
      alt="Afro Extension"
      class="brand-logo-mark"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
    <span v-if="showText" class="brand-logo-text">froExtension</span>
  </NuxtLink>
</template>

<style scoped>
.brand-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-logo-mark {
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: #0d0a08;
}

.brand-logo-text {
  font-family: 'Fraunces', serif;
  font-weight: 500;
  font-size: 16px;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: -0.01em;
}
</style>