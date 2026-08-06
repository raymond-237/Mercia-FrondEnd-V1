  <script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const sf = useStorefront()
const toast = useToast()

// Promo — l'input local reste séparé de sf.promo (qui ne contient que
// le code confirmé côté serveur) ; sf.promoLoading/promoError pilotent
// l'état de la requête réelle vers /v1/storefront/discount-codes/validate.
const promoInput = ref('')
const promoOpen  = ref(false)

async function onApplyPromo() {
  if (!promoInput.value.trim()) return

  const success = await sf.applyPromoCode(promoInput.value)

  if (success) {
    promoOpen.value  = false
    promoInput.value = ''
    toast.success(t('common.toast.promoApplied'))
  }
}

function onRemoveItem(variantId: string) {
  sf.removeFromCart(variantId)
  toast.info(t('common.toast.removedFromCart'))
}

// Vider panier
const clearDialog = ref(false)
function onClearConfirm() {
  sf.clearCart()
  clearDialog.value = false
  toast.info(t('common.toast.cartCleared'))
}
</script>

<template>
  <ui-off-canvas
    :model-value="sf.activeDrawer.value === 'cart'"
    orientation="right"
    size="sm"
    :persistent="false"
    @update:model-value="sf.closeDrawer()"
  >
    <div class="drawer-content">

      <!-- HEAD -->
      <div class="drawer-head">
        <span class="drawer-title">
          {{ t('cart.title') }}
          <span v-if="sf.cartCount.value > 0" class="cart-count">({{ sf.cartCount.value }})</span>
        </span>
        <div class="head-actions">
          <button
            v-if="sf.cartItems.value.length > 0"
            class="clear-btn"
            @click="clearDialog = true"
          >
            <Icon icon="solar:trash-bin-trash-line-duotone" width="28" />
            {{ t('cart.clear') }}
          </button>
          <button class="close-btn text-error" @click="sf.closeDrawer()">
            <Icon icon="solar:close-circle-line-duotone" class="text-error" width="29" />
          </button>
        </div>
      </div>

      <!-- BODY -->
      <div class="drawer-body">

        <!-- Barre livraison gratuite -->
        <div v-if="sf.cartItems.value.length > 0" class="shipping-bar">
          <div class="shipping-text">
            <Icon
              :icon="sf.amountUntilFree.value > 0 ? 'solar:delivery-line-duotone' : 'solar:check-circle-line-duotone'"
              width="20"
            />
            <span v-if="sf.amountUntilFree.value > 0" v-html="t('cart.freeShipping.remaining', { amount: sf.amountUntilFree.value.toFixed(0) })" />
            <span v-else class="free-text"><strong>{{ t('cart.freeShipping.unlocked') }}</strong></span>
          </div>
          <v-progress-linear
            :model-value="sf.freeShippingProgress.value"
            rounded
            height="5"
            color="secondary"
            bg-color="surface-variant"
          />
        </div>

        <!-- État vide -->
        <div v-if="sf.cartItems.value.length === 0" class="empty-state">
          <Icon icon="solar:bag-cross-line-duotone" width="44" />
          <p>{{ t('cart.empty.text') }}</p>
          <v-btn
            variant="tonal"
            rounded="pill"
            size="small"
            @click="sf.closeDrawer(); navigateTo('/shop')"
          >{{ t('cart.empty.exploreShop') }}</v-btn>
        </div>

        <!-- Items -->
        <TransitionGroup v-else name="item" tag="div" class="cart-items">
          <div
            v-for="item in sf.cartItems.value"
            :key="item.variantId"
            class="cart-item"
          >
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.productName"
              class="item-img"
            >
            <div class="item-info">
              <div class="item-name">{{ item.productName }}</div>
              <div class="item-meta">{{ item.variantName }}</div>
              <div class="item-qty">
                <v-btn
                  icon size="x-small" variant="text"
                  @click="sf.updateQty(item.variantId, item.quantity - 1)"
                >
                  <Icon icon="solar:minus-circle-line-duotone" width="25" />
                </v-btn>
                <span>{{ item.quantity }}</span>
                <v-btn
                  icon size="x-small" variant="text"
                  @click="sf.updateQty(item.variantId, item.quantity + 1)"
                >
                  <Icon icon="solar:add-circle-line-duotone" width="25" />
                </v-btn>
              </div>
            </div>
            <div class="item-right">
              <span class="item-price">{{ (item.price * item.quantity).toFixed(2) }}€</span>
              <v-btn
                icon size="x-small" variant="text"
                color="error"
                @click="onRemoveItem(item.variantId)"
              >
                <Icon icon="solar:trash-bin-2-line-duotone" width="20" />
              </v-btn>
            </div>
          </div>
        </TransitionGroup>

      </div>

      <!-- FOOT -->
      <div v-if="sf.cartItems.value.length > 0" class="drawer-foot">

        <!-- Code promo toggle -->
        <div class="promo-section">
          <button class="promo-toggle" @click="promoOpen = !promoOpen">
            <Icon icon="solar:ticket-sale-line-duotone" width="22" />
            <span>{{ sf.promo.value ? sf.promo.value.code : t('cart.promo.prompt') }}</span>
            <Icon
              :icon="promoOpen ? 'solar:alt-arrow-up-line-duotone' : 'solar:alt-arrow-down-line-duotone'"
              width="22"
            />
          </button>

          <v-expand-transition>
            <div v-if="promoOpen && !sf.promo.value" class="promo-field">
              <v-text-field
                v-model="promoInput"
                :placeholder="t('cart.promo.placeholder')"
                variant="solo-filled"
                flat
                rounded="xl"
                density="comfortable"
                hide-details
                :error="!!sf.promoError.value"
                :error-messages="sf.promoError.value ?? ''"
                @keyup.enter="onApplyPromo"
              >
                <template #append-inner>
                  <v-btn
                    size="small" variant="flat" rounded="pill"
                    color="primary"
                    :loading="sf.promoLoading.value"
                    @click="onApplyPromo"
                  >{{ t('cart.promo.apply') }}</v-btn>
                </template>
              </v-text-field>
              <p v-if="sf.promoError.value" class="promo-error">
                <Icon icon="solar:danger-triangle-line-duotone" width="18" />
                {{ sf.promoError.value }}
              </p>
            </div>
          </v-expand-transition>

          <!-- Message d'invalidation même quand le champ n'est pas rouvert —
               évite que le total affiché semble faux sans explication -->
          <p v-if="!promoOpen && sf.promoError.value && !sf.promo.value" class="promo-error">
            <Icon icon="solar:danger-triangle-line-duotone" width="18" />
            {{ sf.promoError.value }}
          </p>
        </div>

        <!-- Totaux -->
        <div class="totals">
          <div class="total-row">
            <span>{{ t('cart.totals.subtotal') }}</span>
            <span>{{ sf.cartSubtotal.value.toFixed(2) }}€</span>
          </div>
          <div v-if="sf.promo.value" class="total-row discount">
            <span>{{ sf.promo.value.code }}</span>
            <span>-{{ sf.cartDiscount.value.toFixed(2) }}€</span>
          </div>
          <div class="total-row total">
            <span>{{ t('cart.totals.total') }}</span>
            <span>{{ sf.cartTotal.value.toFixed(2) }}€</span>
          </div>
          <p class="shipping-note">
            <Icon icon="solar:delivery-line-duotone" width="22" />
            {{ t('cart.totals.shippingNote') }}
          </p>
        </div>

        <!-- CTA -->
        <v-btn
          block rounded="pill" size="large" color="primary"
          @click="sf.closeDrawer(); navigateTo('/checkout')"
        >
          {{ t('cart.checkout') }}
          <Icon icon="solar:arrow-right-line-duotone" width="20" style="margin-left: 6px;" />
        </v-btn>
        <p class="secure-note">
          <Icon icon="solar:lock-keyhole-line-duotone" width="18" />
          {{ t('cart.secureNote') }}
        </p>

      </div>

    </div>
  </ui-off-canvas>

  <!-- Dialog confirmation vider -->
  <v-dialog v-model="clearDialog" max-width="320">
    <v-card rounded="xl" elevation="0">
      <v-card-text class="pt-6 pb-2 text-center">
        <Icon icon="solar:trash-bin-trash-duotone" width="36" style="color: #C0533E; margin-bottom: 12px;" />
        <div style="font-family: Fraunces, serif; font-size: 17px; font-weight: 600; margin-bottom: 6px;">
          {{ t('cart.clearDialog.title') }}
        </div>
        <div style="font-size: 13px; color: rgb(var(--v-theme-on-surface-variant));">
          {{ t('cart.clearDialog.subtitle') }}
        </div>
      </v-card-text>
      <v-card-actions class="px-4 pb-4" style="gap: 8px;">
        <v-btn variant="tonal" rounded="pill" flex @click="clearDialog = false">{{ t('cart.clearDialog.cancel') }}</v-btn>
        <v-btn color="error" variant="flat" rounded="pill" flex @click="onClearConfirm">{{ t('cart.clearDialog.confirm') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.drawer-content { display: flex; flex-direction: column; height: 100%; min-height: 0; }

.drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 20px 16px; border-bottom: 1px solid rgb(var(--v-theme-outline)); flex-shrink: 0;
}
.drawer-title { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 600; }
.cart-count { font-size: 14px; color: rgb(var(--v-theme-on-surface-variant)); }
.head-actions { display: flex; align-items: center; gap: 8px; }
.clear-btn {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: rgb(var(--v-theme-on-surface-variant));
  background: none; border: none; cursor: pointer;
  transition: color .2s;
}
.clear-btn:hover { color: #C0533E; }
.close-btn { background: none; border: none; cursor: pointer; color: rgb(var(--v-theme-on-surface-variant)); display: flex; }

.drawer-body { flex: 1; overflow-y: auto; min-height: 0; padding: 0 20px; }

.shipping-bar { padding: 16px 0; border-bottom: 1px solid rgb(var(--v-theme-outline)); }
.shipping-text {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 10px;
}
.shipping-text strong { color: rgb(var(--v-theme-on-surface)); }
.free-text strong { color: #4C7A4C; }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 48px 0; text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
}
.empty-state p { font-size: 14px; }

.cart-items { padding: 8px 0; }
.cart-item { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid rgb(var(--v-theme-outline)); }
.item-img { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; flex-shrink: 0; }
.item-info { flex: 1; min-width: 0; }
.item-name { font-family: 'Fraunces', serif; font-size: 13.5px; font-weight: 500; margin-bottom: 1px; }
.item-meta { font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 8px; }
.item-qty { display: flex; align-items: center; gap: 6px; }
.item-qty span { font-size: 13px; font-weight: 700; min-width: 18px; text-align: center; }
.item-right { display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; flex-shrink: 0; }
.item-price { font-size: 13px; font-weight: 700; }

.item-enter-active, .item-leave-active { transition: all .25s ease; }
.item-enter-from { opacity: 0; transform: translateX(20px); }
.item-leave-to   { opacity: 0; transform: translateX(-20px); }

.drawer-foot { padding: 16px 20px; border-top: 1px solid rgb(var(--v-theme-outline)); flex-shrink: 0; }

.promo-section { margin-bottom: 14px; }
.promo-toggle {
  display: flex; align-items: center; gap: 7px; width: 100%;
  background: none; border: none; cursor: pointer;
  font-size: 12.5px; font-weight: 600; color: rgb(var(--v-theme-secondary));
  padding: 6px 0;
}
.promo-toggle span { flex: 1; text-align: left; }
.promo-field { padding-top: 10px; }
.promo-error { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #C0533E; margin-top: 6px; }

.totals { margin-bottom: 14px; }
.total-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; padding: 3px 0;
  color: rgb(var(--v-theme-on-surface-variant));
}
.total-row span:last-child { font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.total-row.discount span { color: #4C7A4C; }
.total-row.total {
  font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700;
  color: rgb(var(--v-theme-on-surface)); border-top: 1px solid rgb(var(--v-theme-outline));
  padding-top: 10px; margin-top: 6px;
}
.total-row.total span:last-child { color: rgb(var(--v-theme-secondary)); font-size: 20px; }
.shipping-note {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin: 8px 0 14px;
}

.secure-note {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 8px;
}
</style>