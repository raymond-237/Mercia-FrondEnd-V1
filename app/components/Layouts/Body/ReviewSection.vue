<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ReviewData } from '~/types/public/index.type'

const { t } = useI18n()

withDefaults(
  defineProps<{ reviews?: ReviewData[] }>(),
  {
    reviews: () => [
      {
        id: '1', authorName: 'Fatou K.', authorCity: 'Milan, Italie',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&q=80',
        rating: 5, text: '« Qualité bluffante, exactement comme sur les photos. Livraison soignée et rapide. »',
        productName: 'Ébène Lisse Frontal', productSlug: 'ebene-lisse-frontal',
      },
      {
        id: '2', authorName: 'Aminata D.', authorCity: 'Bruxelles, Belgique',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80',
        rating: 5, text: '« Texture incroyable, tient parfaitement après plusieurs lavages. »',
        productName: 'Miel Bouclé Bundle', productSlug: 'miel-boucle-bundle',
      },
      {
        id: '3', authorName: 'Joelle M.', authorCity: 'Paris, France',
        authorAvatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
        rating: 4, text: '« Le service WhatsApp m\u2019a aidée à choisir la bonne longueur. Très réactif. »',
        productName: 'Châtaigne Éclat', productSlug: 'chataigne-eclat',
      },
    ],
  }
)
</script>

<template>
  <div class="reviews">

    <div class="section-head">
      <div>
        <div class="eyebrow">
          <Icon icon="solar:heart-line-duotone" width="27" />
          {{ t('home.reviews.eyebrow') }}
        </div>
        <h2 class="section-title">{{ t('home.reviews.title') }}</h2>
      </div>
    </div>

    <div class="reviews-grid">
      <div v-for="review in reviews" :key="review.id" class="review-card">

        <div class="review-head">
          <img
            v-if="review.authorAvatarUrl"
            :src="review.authorAvatarUrl"
            :alt="review.authorName"
            class="avatar"
          >
          <div>
            <div class="author-name">{{ review.authorName }}</div>
            <div class="author-city">{{ review.authorCity }}</div>
            <div class="stars" :aria-label="t('common.a11y.ratingOutOf', { rating: review.rating })">
              <Icon
                v-for="i in 5"
                :key="i"
                :icon="i <= review.rating ? 'solar:star-line-duotone' : 'solar:star-line-linear'"
                width="12"
              />
            </div>
          </div>
        </div>

        <p class="review-text">{{ review.text }}</p>

        <NuxtLink :to="`/shop/${review.productSlug}`" class="review-tag">
          <Icon icon="solar:bag-4-line-duotone" width="11" />
          {{ review.productName }}
        </NuxtLink>

      </div>
    </div>
  </div>
</template>

<style scoped>
.reviews { margin-bottom: 40px; }

.section-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
}
.eyebrow {
  display: flex; align-items: center; gap: 6px;
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: rgb(var(--v-theme-secondary)); margin-bottom: 4px;
}
.section-title { font-family: 'Fraunces', serif; font-size: clamp(20px, 2.4vw, 26px); font-weight: 500; }

.reviews-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

.review-card {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-lg);
  padding: 16px;
}

.review-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.author-name { font-size: 13px; font-weight: 700; margin-bottom: 1px; }
.author-city { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 3px; }
.stars { display: flex; gap: 1px; }
.stars :deep(svg) { color: #C68A52; }

.review-text { font-size: 12.5px; line-height: 1.55; margin-bottom: 10px; }

.review-tag {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgb(var(--v-theme-surface));
  padding: 4px 10px; border-radius: var(--r-sm);
  font-size: 10.5px; font-weight: 700; color: rgb(var(--v-theme-secondary));
  text-decoration: none;
}

@media (max-width: 768px) { .reviews-grid { grid-template-columns: 1fr; } }
</style>