<template>
  <div class="detail-skeleton">

    <div class="breadcrumb-skel shimmer text-skel" />

    <div class="detail-layout">

      <!-- Galerie -->
      <div class="gallery-skel">
        <div class="shimmer main-image-skel" />
        <div class="thumbs-skel">
          <div v-for="n in 3" :key="n" class="shimmer thumb-skel" />
        </div>
      </div>

      <!-- Infos -->
      <div class="info-skel">
        <div class="shimmer text-skel name-skel" />
        <div class="shimmer text-skel rating-skel" />
        <div class="shimmer text-skel price-skel" />

        <div class="option-block">
          <div class="shimmer text-skel label-skel" />
          <div class="swatches-skel">
            <div v-for="n in 4" :key="n" class="shimmer swatch-skel" />
          </div>
        </div>

        <div class="shimmer cta-skel" />

        <div class="tabs-skel">
          <div v-for="n in 3" :key="n" class="shimmer tab-skel" />
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.detail-skeleton { padding: 12px 0; }

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

.text-skel { border-radius: var(--r-sm); height: 12px; }

.breadcrumb-skel { width: 140px; height: 10px; margin-bottom: 20px; }

.detail-layout { display: flex; flex-direction: column; gap: 24px; }

.gallery-skel { display: flex; flex-direction: column; gap: 10px; }
.main-image-skel { aspect-ratio: 1; border-radius: var(--r-lg); }
.thumbs-skel { display: none; gap: 8px; }
.thumb-skel { width: 60px; height: 60px; border-radius: 12px; }

.info-skel { display: flex; flex-direction: column; gap: 14px; }
.name-skel { width: 70%; height: 22px; }
.rating-skel { width: 40%; height: 12px; }
.price-skel { width: 30%; height: 26px; margin-bottom: 6px; }

.option-block { display: flex; flex-direction: column; gap: 10px; }
.label-skel { width: 25%; }
.swatches-skel { display: flex; gap: 10px; }
.swatch-skel { width: 36px; height: 36px; border-radius: 50%; }

.cta-skel { height: 52px; border-radius: var(--r-full); margin-top: 8px; }

.tabs-skel { display: flex; gap: 16px; padding-top: 8px; }
.tab-skel { width: 70px; height: 14px; }

@keyframes shimmer-sweep {
  100% { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .shimmer::after { animation: none; }
}

@media (min-width: 960px) {
  .detail-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .thumbs-skel { display: flex; }
}
</style>