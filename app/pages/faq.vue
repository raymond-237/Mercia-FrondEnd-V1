<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

definePageMeta({ layout: 'public' })

const { t, tm, rt } = useI18n()

const GROUP_KEYS = ['orderDelivery', 'products', 'returns'] as const
const ITEM_COUNTS: Record<string, number> = {
    orderDelivery: 3,
    products: 3,
    returns: 2,
}

const faqGroups = computed(() =>
    GROUP_KEYS.map((groupKey) => ({
        key: groupKey,
        title: t(`faq.groups.${groupKey}.title`),
        items: Array.from({ length: ITEM_COUNTS[groupKey] }, (_, i) => ({
            q: t(`faq.groups.${groupKey}.items.item${i + 1}.q`),
            a: t(`faq.groups.${groupKey}.items.item${i + 1}.a`),
        })),
    }))
)
</script>

<template>
  <div>
    <LayoutsNavbar />

    <div class="content">

      <div class="page-header">
        <div class="page-icon">
          <Icon icon="solar:question-circle-line-duotone" width="30" />
        </div>
        <h1>{{ t('faq.header.title') }}</h1>
        <p class="sub">{{ t('faq.header.subtitle') }}</p>
      </div>

      <div v-for="group in faqGroups" :key="group.key" class="faq-group">
        <h2 class="group-title">{{ group.title }}</h2>
        <v-expansion-panels variant="accordion" flat class="faq-panels">
          <v-expansion-panel v-for="item in group.items" :key="item.q" :title="item.q">
            <v-expansion-panel-text>{{ item.a }}</v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <div class="contact-cta">
        <p>{{ t('faq.contactCta.text') }}</p>
        <v-btn variant="tonal" rounded="pill" size="large" to="/contact">
          {{ t('faq.contactCta.button') }}
          <Icon icon="solar:arrow-right-line-duotone" width="16" style="margin-left: 8px;" />
        </v-btn>
      </div>

    </div>

    <LayoutsFooter />
  </div>
</template>

<style scoped>
.content { padding: 0 20px 48px; max-width: 640px; margin: 0 auto; }

.page-header { text-align: center; padding: 28px 0 32px; }
.page-icon {
  width: 52px; height: 52px; border-radius: var(--r-lg); margin: 0 auto 14px;
  background: rgb(var(--v-theme-surface-variant));
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary));
}
h1 { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 600; margin-bottom: 8px; }
.sub { font-size: 13px; color: rgb(var(--v-theme-on-surface-variant)); }

.faq-group { margin-bottom: 28px; }
.group-title {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  color: rgb(var(--v-theme-secondary)); margin-bottom: 12px;
}
.faq-panels :deep(.v-expansion-panel) {
  background: rgb(var(--v-theme-surface-variant)) !important;
  border-radius: var(--r-lg) !important;
  margin-bottom: 8px;
  overflow: hidden;
}
.faq-panels :deep(.v-expansion-panel-title) { font-size: 13.5px; font-weight: 600; }
.faq-panels :deep(.v-expansion-panel-text__wrapper) {
  font-size: 13px; line-height: 1.6; color: rgb(var(--v-theme-on-surface-variant));
}

.contact-cta {
  text-align: center; padding: 24px 0 12px; border-top: 1px solid rgb(var(--v-theme-outline));
}
.contact-cta p { font-size: 13.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 16px; }

@media (min-width: 960px) {
  .content { padding: 0 24px 60px; }
  h1 { font-size: 28px; }
}
</style>