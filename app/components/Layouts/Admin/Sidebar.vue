<script setup lang="ts">
const route = useRoute()
const emit  = defineEmits<{ navigate: [] }>()
const { sidebarCollapsed } = useAdminUI()

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'solar:home-2-line-duotone', to: '/backoffice' },
  {
    label: 'Commandes', icon: 'solar:bag-4-line-duotone', children: [
      { label: 'Toutes les commandes', to: '/backoffice/orders' },
      // { label: 'Retours', to: '/backoffice/orders/returns' },
      // { label: 'Livraison', to: '/backoffice/Shipping' },
      // { label: 'Taxes', to: '/backoffice/taxes' },

      

    ],
  },
   { label: 'Livraison', icon: 'solar:delivery-line-duotone', to: '/backoffice/Shipping' },
   { label: 'Retours', icon: "solar:map-arrow-left-line-duotone", to: '/backoffice/returns' },
   { label: 'Taux de taxe', icon: 'solar:calculator-line-duotone', to: '/backoffice/taxrates' },
   { label: 'Codes Promo', icon: 'solar:ticket-sale-line-duotone', to: '/backoffice/discounts' },


  
   
  {
    label: 'Produits', icon: 'solar:box-line-duotone', children: [
      { label: 'Catalogue', to: '/backoffice/products' },
      { label: 'Catégories', to: '/backoffice/products/categories' },
      { label: 'Fournisseurs', to: '/backoffice/supplier' },

    ],
  },
    // { label: 'Suppliers', icon: "solar:box-line-duotone", to: '/backoffice/supplier' },
  { label: 'Inventaire', icon: "solar:pallete-2-line-duotone", to: '/backoffice/inventory' } ,
  { label: 'Clients', icon: 'solar:users-group-rounded-line-duotone', to: '/backoffice/customers' },
  { label: 'Analytique', icon: 'solar:chart-2-line-duotone', to: '/backoffice/analytic' },
  { label: 'Paramètres', icon: 'solar:settings-line-duotone', to: '/backoffice/settings/general' },
]

const openGroups = ref<string[]>(['Produits'])

function toggleGroup(label: string) {
  if (sidebarCollapsed.value) return // pas de sous-menu déplié en mode icônes
  const idx = openGroups.value.indexOf(label)
  if (idx === -1) openGroups.value.push(label)
  else openGroups.value.splice(idx, 1)
}

function isActive(to: string) {
  return route.path === to
}

function onNavigate() {
  emit('navigate')
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">

    <div class="sidebar-logo">
      <LayoutsLogo :size="42" :show-text="!sidebarCollapsed" />
    </div>

    <nav class="sidebar-nav">
      <template v-for="item in NAV_ITEMS" :key="item.label">

        <!-- Item simple -->
        <NuxtLink
          v-if="!item.children"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
          :title="sidebarCollapsed ? item.label : undefined"
          @click="onNavigate"
        >
          <Icon :icon="item.icon" width="25" />
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </NuxtLink>

        <!-- Item avec sous-menu — en mode collapsed, lien direct vers le 1er enfant -->
        <div v-else class="nav-group">
          <NuxtLink
            v-if="sidebarCollapsed"
            :to="item.children[0].to"
            class="nav-item"
            :class="{ active: item.children.some(c => isActive(c.to)) }"
            :title="item.label"
            @click="onNavigate"
          >
            <Icon :icon="item.icon" width="25" />
          </NuxtLink>

          <template v-else>
            <button class="nav-item nav-item-toggle" @click="toggleGroup(item.label)">
              <Icon :icon="item.icon" width="25" />
              <span>{{ item.label }}</span>
              <Icon
                icon="solar:alt-arrow-down-line-duotone"
                width="15"
                class="chevron"
                :class="{ open: openGroups.includes(item.label) }"
              />
            </button>
            <v-expand-transition>
              <div v-if="openGroups.includes(item.label)" class="nav-children">
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.to"
                  :to="child.to"
                  class="nav-child"
                  :class="{ active: isActive(child.to) }"
                  @click="onNavigate"
                >
                  {{ child.label }}
                </NuxtLink>
              </div>
            </v-expand-transition>
          </template>
        </div>

      </template>
    </nav>

    <div class="sidebar-footer">
      <!-- <button class="logout-btn" :title="sidebarCollapsed ? 'Déconnexion' : undefined">
        <Icon icon="solar:logout-3-line-duotone" width="25" />
        <span v-if="!sidebarCollapsed">Déconnexion</span>
      </button> -->
        <UiLogoutBtn>
                  <template #action="{ logout }">
                    <button class="logout-btn" @click="logout">
                      <Icon icon="solar:logout-3-line-duotone" width="22" />
                      Déconnexion
                    </button>
                  </template>
        </UiLogoutBtn>
    </div>

  </aside>
</template>

<style scoped>
.sidebar {
  width: 264px;
  height: 100%;
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  display: flex;
  flex-direction: column;
  transition: width .2s ease;
}
.sidebar.collapsed { width: 76px; }

.sidebar-logo { padding: 28px 24px 20px; }
.sidebar.collapsed .sidebar-logo { padding: 28px 0 20px; display: flex; justify-content: center; }

.sidebar-nav {
  flex: 1;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
}
.sidebar.collapsed .sidebar-nav { padding: 8px; align-items: center; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px;
  border-radius: var(--r-lg);
  font-size: 13.5px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
  text-decoration: none;
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  transition: background .2s, color .2s;
  white-space: nowrap;
}
.sidebar.collapsed .nav-item { justify-content: center; padding: 12px; width: 44px; }
.nav-item:hover { background: rgb(var(--v-theme-surface-variant)); }
.nav-item.active {
  background: rgba(var(--v-theme-secondary), 0.12);
  color: rgb(var(--v-theme-secondary));
}

.nav-item-toggle { position: relative; }
.chevron { margin-left: auto; transition: transform .2s; flex-shrink: 0; }
.chevron.open { transform: rotate(180deg); }

.nav-children {
  display: flex;
  flex-direction: column;
  padding: 2px 0 6px 46px;
  gap: 2px;
}
.nav-child {
  padding: 8px 12px;
  border-radius: var(--r-sm);
  font-size: 12.5px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
  text-decoration: none;
  transition: background .2s, color .2s;
}
.nav-child:hover { background: rgb(var(--v-theme-surface-variant)); }
.nav-child.active { color: rgb(var(--v-theme-secondary)); }

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  margin-top: auto; /* toujours collé en bas, même si le contenu de nav est court */
}
.sidebar.collapsed .sidebar-footer { padding: 16px 8px; display: flex; justify-content: center; }

.logout-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 14px;
  border-radius: var(--r-md);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
  transition: background .2s, color .2s;
  white-space: nowrap;
}
.sidebar.collapsed .logout-btn { justify-content: center; padding: 12px; width: 44px; }
.logout-btn:hover { background: rgba(192, 83, 62, 0.1); color: #C0533E; }
</style>