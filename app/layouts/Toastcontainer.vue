<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useToast } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

const ICONS: Record<string, string> = {
  success: 'solar:check-circle-bold-duotone',
  error:   'solar:danger-triangle-bold-duotone',
  info:    'solar:info-circle-bold-duotone',
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast-${toast.type}`"
          @click="dismiss(toast.id)"
        >
          <Icon :icon="ICONS[toast.type]" width="20" />
          <span>{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: 0;
  right: 0;
  z-index: 300;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 420px;
  padding: 13px 16px;
  border-radius: var(--r-lg);
  font-size: 13px;
  font-weight: 600;
  color: #FAFAF8;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  pointer-events: auto;
}

.toast-success { background: #4C7A4C; }
.toast-error   { background: #C0533E; }
.toast-info    { background: rgb(var(--v-theme-primary)); }

.toast-enter-active,
.toast-leave-active {
  transition: transform .25s ease, opacity .25s ease;
}
.toast-enter-from {
  transform: translateY(-16px);
  opacity: 0;
}
.toast-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}
.toast-move {
  transition: transform .25s ease;
}

@media (min-width: 960px) {
  .toast-stack {
    left: auto;
    right: 24px;
    align-items: flex-end;
    padding: 0;
  }
  .toast {
    max-width: 360px;
  }
}
</style>