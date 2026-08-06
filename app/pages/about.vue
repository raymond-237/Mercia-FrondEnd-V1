<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

definePageMeta({ layout: 'public' })
</script>

<template>
  <div>
    <LayoutsNavbar />

    <div class="content">

      <div class="hero-block">
        <span class="eyebrow">{{ t('about.hero.eyebrow') }}</span>
        <h1>{{ t('about.hero.title') }}</h1>
        <p class="slogan">{{ t('about.hero.slogan') }}</p>
        <p class="lead">{{ t('about.hero.lead') }}</p>
      </div>

      <div class="values-grid">
        <div class="value-card">
          <div class="value-icon">
            <Icon icon="solar:leaf-line-duotone" width="29" />
          </div>
          <h3>{{ t('about.values.quality.title') }}</h3>
          <p>{{ t('about.values.quality.text') }}</p>
        </div>
        <div class="value-card">
          <div class="value-icon">
            <Icon icon="solar:delivery-line-duotone" width="29" />
          </div>
          <h3>{{ t('about.values.delivery.title') }}</h3>
          <p>{{ t('about.values.delivery.text') }}</p>
        </div>
        <div class="value-card">
          <div class="value-icon">
            <Icon icon="solar:heart-line-duotone" width="29" />
          </div>
          <h3>{{ t('about.values.care.title') }}</h3>
          <p>{{ t('about.values.care.text') }}</p>
        </div>
      </div>

      <div class="story-block">
        <h2>{{ t('about.story.title') }}</h2>
        <p>{{ t('about.story.paragraph1') }}</p>
        <p>{{ t('about.story.paragraph2') }}</p>
        <p>{{ t('about.story.paragraph3') }}</p>
      </div>

      <div class="cta-block">
        <h2>{{ t('about.cta.title') }}</h2>
        <v-btn color="primary" variant="flat" rounded="pill" size="large" to="/shop">
          {{ t('about.cta.button') }}
          <Icon icon="solar:arrow-right-line-duotone" width="16" style="margin-left: 8px;" />
        </v-btn>
      </div>

    </div>

    <LayoutsFooter />
  </div>
</template>

<style scoped>
.content { padding: 0 20px 48px; max-width: 720px; margin: 0 auto; }

.hero-block { padding: 32px 0 28px; text-align: center; }
.eyebrow {
  display: inline-block; font-size: 25.5px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: rgb(var(--v-theme-secondary)); margin-bottom: 10px;
}
h1 {
  font-family: 'Fraunces', serif; font-size: clamp(26px, 6vw, 36px);
  font-weight: 600; margin-bottom: 10px; line-height: 1.15;
}
.slogan {
  font-family: 'Fraunces', serif; font-style: italic; font-size: 17px;
  color: rgb(var(--v-theme-secondary)); margin-bottom: 14px;
}
.lead {
  font-size: 14px; line-height: 1.65; color: rgb(var(--v-theme-on-surface-variant));
  max-width: 480px; margin: 0 auto;
}

.values-grid {
  display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 36px;
}
.value-card {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-xl); padding: 20px; text-align: center;
}
.value-icon {
  width: 48px; height: 48px; border-radius: 50%; margin: 0 auto 12px;
  background: rgb(var(--v-theme-surface));
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary));
}
.value-card h3 { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 600; margin-bottom: 6px; }
.value-card p { font-size: 12.5px; color: rgb(var(--v-theme-on-surface-variant)); line-height: 1.5; }

.story-block { margin-bottom: 36px; }
.story-block h2 { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; margin-bottom: 14px; }
.story-block p {
  font-size: 13.5px; line-height: 1.7; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 14px;
}

.cta-block {
  text-align: center; background: rgb(var(--v-theme-primary)); color: #FAFAF8;
  border-radius: var(--r-xl); padding: 32px 20px;
}
.cta-block h2 { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 600; margin-bottom: 18px; }

@media (min-width: 960px) {
  .content { padding: 0 24px 60px; }
  .hero-block { padding: 48px 0 40px; }
  .values-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
}
</style>