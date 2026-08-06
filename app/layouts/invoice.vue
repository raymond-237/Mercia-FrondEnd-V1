<script setup lang="ts">
</script>

<template>
  <v-app>
    <div class="invoice-page-bg">
      <div class="invoice-toolbar no-print">
        <NuxtLink to="/backoffice/orders" class="back-link">
          <Icon icon="solar:alt-arrow-left-line-duotone" width="16" />
          Retour aux commandes
        </NuxtLink>
        <v-btn color="secondary" variant="flat" rounded="xl" @click="window.print()">
          <Icon icon="solar:printer-line-duotone" width="16" style="margin-right: 6px;" />
          Imprimer
        </v-btn>
      </div>
      <div class="invoice-sheet">
        <slot />
      </div>
    </div>
  </v-app>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');
</style>

<style scoped>
.invoice-page-bg {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.invoice-toolbar {
  width: 100%;
  max-width: 720px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.back-link {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700;
  color: rgb(var(--v-theme-on-surface-variant));
  text-decoration: none;
}

.invoice-sheet {
  width: 100%;
  max-width: 720px;
  background: #FFFFFF;
  border-radius: var(--r-xl);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  padding: 48px;
  color: #1A1210;
}

@media print {
  .no-print { display: none !important; }
  .invoice-page-bg { padding: 0; background: #fff; min-height: 0; }
  .invoice-sheet { box-shadow: none; border-radius: 0; padding: 20px; max-width: 100%; }
}

@media (max-width: 600px) {
  .invoice-sheet { padding: 24px 20px; }
}
</style>