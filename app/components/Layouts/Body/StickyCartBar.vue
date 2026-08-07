<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const sf = useStorefront()

function onOpen() {
  if (import.meta.client) navigator.vibrate?.(10)
  sf.openCart()
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="sf.cartCount.value > 0"
      class="sticky-bar"
      @click="onOpen"
    >
      <span class="bar-label">
        <Icon icon="solar:bag-4-duotone" width="18" />
        {{ t('cart.stickyBar.items', sf.cartCount.value) }}
        · {{ sf.cartTotal.value.toFixed(2) }}€
      </span>
      <span class="bar-action">
        {{ t('cart.stickyBar.view') }}
        <Icon icon="solar:arrow-right-line-duotone" width="18" />
      </span>
    </div>
  </Transition>
</template>

<style scoped>
.sticky-bar {
  display: none;
  position: fixed;
  bottom: 16px; left: 16px; right: 16px;
  z-index: 90;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-radius: var(--r-full);
  padding: 14px 20px;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  user-select: none;
}
.bar-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; }
.bar-action {
  display: flex; align-items: center; gap: 5px;
  background: #C68A52; color: #2B1810;
  padding: 8px 14px; border-radius: var(--r-full);
  font-size: 12px; font-weight: 700;
}

.slide-up-enter-active, .slide-up-leave-active { transition: transform .3s ease, opacity .3s; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(24px); opacity: 0; }

@media (max-width: 768px) { .sticky-bar { display: flex; } }
</style>