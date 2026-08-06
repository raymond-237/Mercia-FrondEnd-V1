<template>
  <div class="card-skeleton">
    <div class="shimmer image-skel" />
    <div class="shimmer text-skel title-skel" />
    <div class="shimmer text-skel meta-skel" />
    <div class="shimmer text-skel price-skel" />
  </div>
</template>

<style scoped>
.card-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shimmer {
  position: relative;
  overflow: hidden;
  background: rgb(var(--v-theme-surface-variant));
}
.shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(255, 255, 255, 0.35) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  animation: shimmer-sweep 1.6s ease-in-out infinite;
}

.image-skel {
  aspect-ratio: 1;
  border-radius: var(--r-lg);
}

.text-skel { border-radius: var(--r-sm); height: 10px; }
.title-skel { width: 80%; height: 12px; margin-top: 2px; }
.meta-skel  { width: 55%; }
.price-skel { width: 35%; height: 13px; margin-top: 2px; }

@keyframes shimmer-sweep {
  100% { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .shimmer::after { animation: none; }
}
</style>