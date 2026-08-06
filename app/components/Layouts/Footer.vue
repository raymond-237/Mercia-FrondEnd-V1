<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { t } = useI18n()

const { data: publicSettings } = await usePublicSettings()

const socials = computed(() => {
  const links = publicSettings.value?.socialLinks
  return [
    { icon: 'tabler:brand-instagram', label: 'Instagram', href: links?.instagram },
    { icon: 'tabler:brand-whatsapp',  label: 'WhatsApp',  href: links?.whatsapp },
    { icon: 'tabler:brand-tiktok',    label: 'TikTok',    href: links?.tiktok },
  ].filter((s): s is { icon: string; label: string; href: string } => !!s.href)
})

const brandName    = computed(() => publicSettings.value?.shopName ?? t('footer.brand.name'))
const brandTagline = computed(() => publicSettings.value?.tagline ?? t('footer.brand.tagline'))

const columns = computed(() => [
  {
    key: 'shop',
    title: t('footer.columns.shop.title'),
    links: [
      { to: '/shop', label: t('footer.columns.shop.collection') },
      { to: '/shop?category=perruques', label: t('footer.columns.shop.wigs') },
      { to: '/shop?category=meches', label: t('footer.columns.shop.extensions') },
      { to: '/shop?category=soins', label: t('footer.columns.shop.care') },
    ],
  },
  {
    key: 'help',
    title: t('footer.columns.help.title'),
    links: [
      { to: '/tracking', label: t('footer.columns.help.tracking') },
      { to: '/returns', label: t('footer.columns.help.returns') },
      { to: '/faq', label: t('footer.columns.help.faq') },
    ],
  },
  {
    key: 'about',
    title: t('footer.columns.about.title'),
    links: [
      { to: '/about', label: t('footer.columns.about.story') },
      { to: '/contact', label: t('footer.columns.about.contact') },
      { to: '/legal', label: t('footer.columns.about.legal') },
    ],
  },
])
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">

      <!-- Brand -->
      <div class="footer-brand">
        <div class="brand-name">
          <LayoutsLogo/>
          {{ brandName }}
        </div>
        <p>{{ brandTagline }}</p>
        <div v-if="socials.length" class="socials">
          <a
            v-for="s in socials"
            :key="s.label"
            :href="s.href"
            :aria-label="s.label"
            target="_blank"
            rel="noopener"
          >
            <Icon :icon="s.icon" width="16" />
          </a>
        </div>
      </div>

      <!-- Desktop grid -->
      <div class="footer-grid">
        <div v-for="col in columns" :key="col.key" class="footer-col">
          <h4>{{ col.title }}</h4>
          <NuxtLink v-for="link in col.links" :key="link.to" :to="link.to">{{ link.label }}</NuxtLink>
        </div>
      </div>

      <!-- Mobile accordéon -->
      <v-expansion-panels class="footer-mobile" variant="accordion" flat>
        <v-expansion-panel v-for="col in columns" :key="col.key" :title="col.title">
          <v-expansion-panel-text>
            <NuxtLink v-for="link in col.links" :key="link.to" :to="link.to">{{ link.label }}</NuxtLink>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <div class="footer-bottom">
        <span>{{ t('footer.bottom.copyright') }}</span>
        <span class="dot">·</span>
        <span>{{ t('footer.bottom.securePayment') }}</span>
      </div>

    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: rgb(var(--v-theme-primary));
  color: rgba(250,250,248,0.7);
}

.footer-inner { padding: 32px 20px 20px; }

.footer-brand { margin-bottom: 24px; }
.brand-name {
  font-family: 'Fraunces', serif;
  font-size: 17px;
  color: #FAFAF8;
  margin-bottom: 8px;
}
.footer-brand p {
  font-size: 12px;
  line-height: 1.6;
  max-width: 280px;
  margin-bottom: 16px;
  color: rgba(250,250,248,0.6);
}

.socials { display: flex; gap: 8px; }
.socials a {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(250,250,248,0.08);
  display: flex; align-items: center; justify-content: center;
  color: rgba(250,250,248,0.85);
  transition: background .2s, color .2s, transform .15s;
}
.socials a:hover {
  background: rgb(var(--v-theme-secondary));
  color: rgb(var(--v-theme-on-primary));
  transform: translateY(-2px);
}

.footer-grid { display: none; }

.footer-mobile {
  margin-bottom: 20px;
  border-top: 1px solid rgba(250,250,248,0.1);
}
.footer-mobile :deep(.v-expansion-panel) {
  background: transparent !important;
  color: rgba(250,250,248,0.85);
  border-bottom: 1px solid rgba(250,250,248,0.1);
}
.footer-mobile :deep(.v-expansion-panel-title) {
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 14px 4px;
  min-height: unset;
  color: #FAFAF8;
}
.footer-mobile :deep(.v-expansion-panel-title__overlay) { background: transparent; }
.footer-mobile :deep(.v-expansion-panel-text__wrapper) {
  padding: 0 4px 16px;
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.footer-mobile :deep(.v-icon) { color: rgba(250,250,248,0.6); }

.footer-mobile a {
  font-size: 12.5px;
  color: rgba(250,250,248,0.65);
  text-decoration: none;
  transition: color .2s;
}
.footer-mobile a:hover { color: #FAFAF8; }

.footer-col h4 {
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: #FAFAF8; margin-bottom: 12px;
}
.footer-col a {
  display: block; font-size: 12.5px; margin-bottom: 9px;
  color: rgba(250,250,248,0.7); text-decoration: none; transition: color .2s;
}
.footer-col a:hover { color: #FAFAF8; }

.footer-bottom {
  border-top: 1px solid rgba(250,250,248,0.1);
  padding-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 10.5px;
  text-align: center;
  color: rgba(250,250,248,0.55);
}
.footer-bottom .dot { opacity: 0.5; }

@media (min-width: 960px) {
  .footer-inner { padding: 48px 48px 28px; }

  .footer-brand { margin-bottom: 0; max-width: none; }
  .footer-brand p { font-size: 11.5px; max-width: 220px; }

  .footer-grid {
    display: grid;
    grid-template-columns: 1.4fr repeat(3, 1fr);
    gap: 32px;
    align-items: start;
    margin-bottom: 32px;
  }
  .footer-grid .footer-brand { grid-column: 1; margin-bottom: 0; }

  .footer-mobile { display: none; }

  .footer-bottom {
    justify-content: space-between;
    font-size: 11px;
  }
  .footer-bottom .dot { display: none; }
}
</style>