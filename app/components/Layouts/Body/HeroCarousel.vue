<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { request } from '~/@cores/constantes/helpers'
import useSettingsService from '~/services/Models/settings.service';

const { t } = useI18n()
const service = useSettingsService();
interface Slide {
  id: string | number
  eyebrow?: string
  title: string
  sub: string
  cta?: { label: string; to: string }
  ctaSecondary?: { label: string; to: string }
  image: string
  tone: 'primary' | 'secondary'
}

interface SlideMeta {
  id: number
  ctaTo: string
  ctaSecondaryTo: string
  image: string
  tone: 'primary' | 'secondary'
}

const staticSlidesMeta: SlideMeta[] = [
  { id: 1, ctaTo: '/shop', ctaSecondaryTo: '#',     image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=1200&q=85', tone: 'secondary' },
  { id: 2, ctaTo: '/shop', ctaSecondaryTo: '#',     image: 'https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?w=1200&q=85', tone: 'primary' },
  // { id: 3, ctaTo: '/shop', ctaSecondaryTo: '/livraison', image: 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=1200&q=85', tone: 'secondary' },
]

const staticSlides = computed<Slide[]>(() => staticSlidesMeta.map((s, i) => ({
  id: `static-${s.id}`,
  image: s.image,
  tone: s.tone,
  eyebrow: t(`home.hero.slides.slide${i + 1}.eyebrow`),
  title:   t(`home.hero.slides.slide${i + 1}.title`),
  sub:     t(`home.hero.slides.slide${i + 1}.sub`),
  cta:          { label: t(`home.hero.slides.slide${i + 1}.cta`),          to: s.ctaTo },
  ctaSecondary: { label: t(`home.hero.slides.slide${i + 1}.ctaSecondary`), to: s.ctaSecondaryTo },
})))

// ── Slides dynamiques (backend) ─────────────────────────────────────
// useAsyncData : résolu côté serveur, pas de flash "statique puis DB"
// au premier rendu, et pas de blocage si l'appel échoue (fallback silencieux).
const { data: dbSlidesRaw } = await useAsyncData('public-hero-slides', async () => {
  try {
    const response = await service.fetchHero()
    console.log('[hero] réponse publique', JSON.stringify(response))

    // return response.slides ?? []
    return Array.isArray(response) ? response : []
  } catch (e) {
    console.error('[hero] Impossible de charger les slides depuis le backend, fallback statique:', e)
    return []
  }
})

function mapDbSlide(raw: any, index: number): Slide {
  return {
    id: `db-${index}`,
    image: raw.image,
    tone: raw.tone || (index % 2 === 0 ? 'secondary' : 'primary'),
    eyebrow: raw.eyebrow || undefined,
    title: raw.title || '',
    sub: raw.subtitle || '',
    cta: (raw.ctaLabel || raw.ctaTo)?
    {
      label: raw.ctaLabel || t('home.hero.slides.defaultCta'),
      to: raw.ctaTo || '/shop',
    }:undefined,
    ctaSecondary: (raw.ctaSecondaryLabel && raw.ctaSecondaryTo)
      ? { label: raw.ctaSecondaryLabel, to: raw.ctaSecondaryTo }
      : undefined,
  }
}

const slides = computed<Slide[]>(() => {
  const db = dbSlidesRaw.value ?? []

  if (Array.isArray(db) && db.length > 0) {
    return db
      .filter((s: any) => s.isActive !== false && s.image)
      .map((s: any, i: number) => mapDbSlide(s, i))
  }

  return staticSlides.value
})

const current = ref(0)
const timer   = ref<ReturnType<typeof setInterval> | null>(null)

function goTo(idx: number) {
  current.value = (idx + slides.value.length) % slides.value.length
  restartTimer()
}
function next() { goTo(current.value + 1) }
function prev() { goTo(current.value - 1) }

function startTimer()   { timer.value = setInterval(next, 5000) }
function stopTimer()    { if (timer.value) clearInterval(timer.value) }
function restartTimer() { stopTimer(); startTimer() }

// Swipe tactile
let touchStartX = 0
let touchDeltaX = 0

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchDeltaX = 0
  stopTimer()
}
function onTouchMove(e: TouchEvent) {
  touchDeltaX = e.touches[0].clientX - touchStartX
}
function onTouchEnd() {
  if (touchDeltaX < -40) next()
  else if (touchDeltaX > 40) prev()
  else startTimer()
}

onMounted(startTimer)
onUnmounted(stopTimer)
</script>

<template>
  <div
    class="hero mb-6"
    @mouseenter="stopTimer"
    @mouseleave="startTimer"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend.passive="onTouchEnd"
  >

    <div class="hero-track" :style="{ transform: `translateX(-${current * 100}%)` }">
        <div v-for="slide in slides" :key="slide.id" class="hero-slide">
          <img class="hero-backdrop" :src="slide.image" alt="" aria-hidden="true">
          <img class="hero-image" :src="slide.image" :alt="slide.eyebrow || slide.title" loading="eager">
        <div class="hero-fade" />

        <div class="hero-copy">
          <span v-if="slide.eyebrow" class="hero-eyebrow">
            <Icon icon="solar:star-line-duotone" width="12" />
            {{ slide.eyebrow }}
          </span>
          <h1 v-if="slide.title" class="hero-title">{{ slide.title }}</h1>
          <p v-if="slide.sub" class="hero-sub">{{ slide.sub }}</p>

          <div v-if="slide.cta || slide.ctaSecondary" class="hero-ctas">
            <NuxtLink
              v-if="slide.cta"
              :to="slide.cta.to"
              class="hero-cta-primary"
              :class="`tone-${slide.tone}`"
            >
              {{ slide.cta.label }}
              <Icon icon="solar:arrow-right-line-duotone" width="14" />
            </NuxtLink>

            <NuxtLink v-if="slide.ctaSecondary" :to="slide.ctaSecondary.to" class="hero-cta-secondary">
              {{ slide.ctaSecondary.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation groupée à droite -->
    <div class="hero-nav">
      <div class="hero-dots">
        <button
          v-for="(slide, i) in slides"
          :key="slide.id"
          class="hero-dot"
          :class="{ active: i === current }"
          :aria-label="`Aller à la diapo ${i + 1}`"
          @click="goTo(i)"
        />
      </div>

      <div class="hero-arrows">
        <button class="hero-arrow" aria-label="Précédent" @click="prev">
          <Icon icon="solar:alt-arrow-left-line-duotone" width="16" />
        </button>
        <button class="hero-arrow" aria-label="Suivant" @click="next">
          <Icon icon="solar:alt-arrow-right-line-duotone" width="16" />
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap');

.hero {
  position: relative;
  /* border-radius: 18px; */
  display: block;
  width: 100%;
  overflow: hidden;
  aspect-ratio: 3 / 4;
  max-height: 560px;
  touch-action: pan-y;
  background: rgb(var(--v-theme-surface-variant));
}

.hero-track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform .6s cubic-bezier(.4,0,.2,1);
}

.hero-slide {
  position: relative;
  flex: 0 0 100%;
  height: 100%;
}

.hero-image {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
}

.hero-backdrop {
  display: none;
}

.hero-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(26,18,16,0) 0%,
    rgba(26,18,16,0) 46%,
    rgba(26,18,16,0.66) 100%
  );
}

.hero-copy {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: 0 26px 44px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #FAFAF8;
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #FAFAF8;
}

.hero-title {
  font-family: 'Fraunces', serif;
  font-optical-sizing: auto;
  font-size: clamp(32px, 9vw, 42px);
  font-weight: 600;
  line-height: 1.04;
  letter-spacing: -0.02em;
  white-space: pre-line;
  margin: 0;
  text-shadow: 0 4px 20px rgba(0,0,0,0.25);
}

.hero-sub {
  font-size: 13px;
  line-height: 1.55;
  color: rgba(250,250,248,0.85);
  max-width: 280px;
  margin: 0;
}

.hero-ctas {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.hero-cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 13px 24px;
  border-radius: var(--r-full);
  font-size: 13px;
  font-weight: 700;
  color: #FAFAF8;
  text-decoration: none;
  transition: transform .15s ease, box-shadow .15s ease;
}
.hero-cta-primary.tone-primary   { background: rgb(var(--v-theme-primary)); }
.hero-cta-primary.tone-secondary { background: rgb(var(--v-theme-secondary)); }
.hero-cta-primary:hover  { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.25); }
.hero-cta-primary:active { transform: scale(0.97); }

.hero-cta-secondary {
  font-size: 12.5px;
  font-weight: 700;
  color: #FAFAF8;
  text-decoration: none;
  border-bottom: 1.5px solid rgba(250,250,248,0.6);
  padding-bottom: 2px;
  transition: opacity .2s;
}
.hero-cta-secondary:hover { opacity: 0.65; }

.hero-nav {
  position: absolute;
  right: 22px;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  z-index: 5;
}

.hero-dots {
  display: flex;
  gap: 6px;
}

.hero-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background .2s, transform .2s;
}
.hero-dot.active {
  background: #FAFAF8;
  transform: scale(1.3);
}

.hero-arrows {
  display: flex;
  gap: 8px;
}

.hero-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.14);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.24);
  color: #FAFAF8;
  cursor: pointer;
  transition: background .2s;
}
.hero-arrow:hover { background: rgba(255,255,255,0.26); }

@media (min-width: 960px) {
  .hero {
    width: 100%;
    aspect-ratio: unset;
    height: 480px;
    max-height: none;
  }

  .hero-copy { padding: 0 48px 56px; max-width: 460px; }
  .hero-title { font-size: clamp(38px, 3.8vw, 48px); }
  .hero-sub   { max-width: 320px; font-size: 13.5px; }

  .hero-nav { right: 48px; bottom: 32px; }

  .hero-arrow { width: 36px; height: 36px; }

  .hero-backdrop {
  display: block;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(32px) saturate(1.2);
  transform: scale(1.15);
}

.hero-image {
  object-fit: contain;
  object-position: right center;
}
}
</style>