<script setup lang="ts">
import { useI18n } from 'vue-i18n'

definePageMeta({ layout: 'public' })

const { t } = useI18n()
</script>

<template>
  <div>
    <LayoutsNavbar />

    <div class="content">

      <h1>{{ t('legal.title') }}</h1>
      <p class="updated">{{ t('legal.updated') }}</p>

      <section>
        <h2>{{ t('legal.publisher.title') }}</h2>
        <p>
          {{ t('legal.publisher.text') }}
          <!-- TODO: remplacer par les vraies informations légales
               (raison sociale, forme juridique, adresse, SIRET/équivalent,
               contact du responsable de publication) avant mise en production. -->
        </p>
      </section>

      <!-- <section> -->
        <!-- <h2>{{ t('legal.hosting.title') }}</h2> -->
        <!-- <p> -->
          <!-- {{ t('legal.hosting.text') }} -->
          <!-- TODO: compléter avec les vraies informations d'hébergement -->
        <!-- </p> -->
      <!-- </section> -->

      <section>
        <h2>{{ t('legal.intellectualProperty.title') }}</h2>
        <p>{{ t('legal.intellectualProperty.text') }}</p>
      </section>

      <section>
        <h2>{{ t('legal.personalData.title') }}</h2>
        <p>{{ t('legal.personalData.text') }}</p>
      </section>

      <section>
        <h2>{{ t('legal.securePayment.title') }}</h2>
        <p>{{ t('legal.securePayment.text') }}</p>
      </section>

      <section>
        <h2>{{ t('legal.contact.title') }}</h2>
        <p>
          {{ t('legal.contact.textBefore') }}
          <NuxtLink to="/contact">{{ t('legal.contact.linkLabel') }}</NuxtLink>.
        </p>
      </section>

    </div>

    <LayoutsFooter />
  </div>
</template>

<style scoped>
.content { padding: 0 20px 48px; max-width: 640px; margin: 0 auto; }

h1 {
  font-family: 'Fraunces', serif; font-size: 24px; font-weight: 600;
  padding-top: 28px; margin-bottom: 4px;
}
.updated { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 28px; }

section { margin-bottom: 24px; }
h2 { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 600; margin-bottom: 8px; }
p { font-size: 13px; line-height: 1.7; color: rgb(var(--v-theme-on-surface-variant)); }
p a { color: rgb(var(--v-theme-secondary)); font-weight: 600; text-decoration: none; }

@media (min-width: 960px) {
  .content { padding: 0 24px 60px; }
  h1 { font-size: 28px; padding-top: 40px; }
}
</style>