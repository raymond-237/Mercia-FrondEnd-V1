<script setup lang="ts">
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { useI18n } from 'vue-i18n'

import type { ShippingMethodData, PaymentMethodOption } from '~/types/public/index.type'
import type { CheckoutPayload } from '~/types/Models/order.type'
import { useOrdersStore } from '~/stores/Models/order.store'
import { SHIPPING_COUNTRIES } from '~/@cores/constantes/countries'

definePageMeta({ layout: 'form' })

const { t }        = useI18n()
const sf            = useStorefront()
const ordersStore   = useOrdersStore()
const step          = ref(1)

// ── Schémas Yup par étape

const infoSchema = computed(() => yup.object({
  firstName: yup.string().required(t('checkout.validation.firstNameRequired')),
  lastName:  yup.string().required(t('checkout.validation.lastNameRequired')),
  email:     yup.string().email(t('checkout.validation.emailInvalid')).required(t('checkout.validation.emailRequired')),
  phone:     yup.string().required(t('checkout.validation.phoneRequired')),
}))

const addressSchema = computed(() => yup.object({
  addressLine1: yup.string().required(t('checkout.validation.addressRequired')),
  city:         yup.string().required(t('checkout.validation.cityRequired')),
  postalCode:   yup.string().required(t('checkout.validation.postalCodeRequired')),
  country:      yup.string().required(t('checkout.validation.countryRequired')),
}))

// ── Formulaire step 1

const infoForm = useForm({ validationSchema: infoSchema })
const { value: firstName, errorMessage: errFirstName } = useField<string>('firstName')
const { value: lastName,  errorMessage: errLastName  } = useField<string>('lastName')
const { value: email,     errorMessage: errEmail     } = useField<string>('email')
const { value: phone,     errorMessage: errPhone     } = useField<string>('phone')

// ── Formulaire step 2

const addressForm = useForm({ validationSchema: addressSchema })
const { value: addressLine1, errorMessage: errAddr    } = useField<string>('addressLine1')
const { value: city,         errorMessage: errCity    } = useField<string>('city')
const { value: postalCode,   errorMessage: errPostal  } = useField<string>('postalCode')
const { value: country,      errorMessage: errCountry } = useField<string>('country')

function onAddressSelected(addr: { addressLine1: string; city: string; postalCode: string; countryCode: string }) {
  addressLine1.value = addr.addressLine1
  if (addr.city) city.value = addr.city
  if (addr.postalCode) postalCode.value = addr.postalCode
  if (addr.countryCode && SHIPPING_COUNTRIES.some(c => c.code === addr.countryCode)) {
    country.value = addr.countryCode
  }
}

// ── Step 3 — Livraison + Paiement (fusionnés)

const shippingMethods        = ref<ShippingMethodData[]>([])
const selectedShipping       = ref<string>('')
const shippingMethodsError   = ref(false)
const loadingShippingMethods = ref(false)

const loadShippingMethods = async () => {
  loadingShippingMethods.value = true
  shippingMethodsError.value   = false
  try {
    const data = await ordersStore.fetchShippingMethods({
      country: country.value,
      subtotal: sf.cartSubtotal.value,
    })

    if (ordersStore.error) {
      // Échec réel de l'appel — jamais de repli sur des données fictives
      // (ancien FALLBACK_SHIPPING_METHODS avec des ids "std"/"exp") : ces
      // faux ids partaient ensuite vers fetchPaymentMethods(), qui les
      // envoyait tels quels à une colonne UUID côté Postgres → crash. Un
      // état d'erreur explicite est plus sûr qu'une fausse donnée qui
      // casse tout en aval.
      shippingMethodsError.value = true
      shippingMethods.value      = []
      return
    }

    // Zéro échec API, mais zéro méthode configurée pour ce pays — état
    // légitime, pas une erreur, mais pas de faux id à générer non plus.
    shippingMethods.value  = data ?? []
    selectedShipping.value = shippingMethods.value[0]?.id ?? ''
  } catch (e) {
    console.error('Erreur chargement méthodes de livraison:', e)
    shippingMethodsError.value = true
    shippingMethods.value      = []
  } finally {
    loadingShippingMethods.value = false
  }
}

function estimatedDeliveryLabel(minDays: number, maxDays: number): string {
  const start = new Date()
  const end   = new Date()
  start.setDate(start.getDate() + minDays)
  end.setDate(end.getDate() + maxDays)

  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return minDays === maxDays ? fmt(start) : `${fmt(start)} – ${fmt(end)}`
}

const selectedMethod = computed(
  () => shippingMethods.value.find(m => m.id === selectedShipping.value)
)

// ── Paiement — chargé automatiquement dès qu'une livraison est choisie

const paymentMethods        = ref<PaymentMethodOption[]>([])
const selectedPayment        = ref<string | null>(null)
const loadingPaymentMethods = ref(false)

async function loadPaymentMethods(shippingMethodId: string) {
  loadingPaymentMethods.value = true
  try {
    const data = await ordersStore.fetchPaymentMethods(shippingMethodId)
    paymentMethods.value  = data
    selectedPayment.value = data[0]?.method ?? null
  } catch (e) {
    console.error('Erreur chargement moyens de paiement:', e)
    paymentMethods.value  = []
    selectedPayment.value = null
  } finally {
    loadingPaymentMethods.value = false
  }
}

// Zéro tap requis entre livraison et paiement — le choix d'une méthode
// de livraison déclenche immédiatement le chargement des moyens de
// paiement compatibles, y compris pour la sélection par défaut.
watch(selectedShipping, (id) => {
  if (id) loadPaymentMethods(id)
})

const selectedPaymentDetails = computed(
  () => paymentMethods.value.find(m => m.method === selectedPayment.value)
)

const paymentIcons: Record<string, string> = {
  paypal: 'solar:card-line-duotone',
  bank_transfer: 'solar:banknote-2-line-duotone',
  cash: 'solar:wallet-money-line-duotone',
}

const orderTotal = computed(
  () => sf.cartTotal.value + (selectedMethod.value?.price ?? 0)
)

// ── Navigation entre étapes

const stepIcons = [
  'solar:user-circle-line-duotone',
  'solar:map-point-line-duotone',
  'solar:bill-list-line-duotone',
]
const stepLabels = computed(() => [
  t('checkout.steps.contact'),
  t('checkout.steps.address'),
  t('checkout.steps.finalize'),
])

async function goNext() {
  if (step.value === 1) {
    const { valid } = await infoForm.validate()
    if (!valid) return
  }
  if (step.value === 2) {
    const { valid } = await addressForm.validate()
    if (!valid) return
    await loadShippingMethods()
  }
  if (step.value < 3) step.value++
}

function goBack() {
  if (step.value > 1) step.value--
}

// ── Paiement final

const paying        = ref(false)
const checkoutError = ref('')

async function onPay() {
  if (!selectedPayment.value) {
    checkoutError.value = t('checkout.step4.paymentMethodRequired')
    return
  }

  paying.value        = true
  checkoutError.value = ''

  const payload: CheckoutPayload = {
    email: email.value,
    firstName: firstName.value,
    lastName: lastName.value,
    phone: phone.value,
    shippingAddress: {
      firstName: firstName.value,
      lastName: lastName.value,
      addressLine1: addressLine1.value,
      city: city.value,
      postalCode: postalCode.value,
      countryCode: country.value,
    },
    items: sf.cartItems.value.map(item => ({
      productVariantId: item.variantId,
      quantity: item.quantity,
    })),
    shippingMethodId: selectedShipping.value,
    paymentMethod: selectedPayment.value,
    source: 'web',
  }

  try {
    const order = await ordersStore.submitCheckout(payload)

    if (!order) {
      checkoutError.value = ordersStore.error ?? t('checkout.step4.genericError')
      paying.value = false
      return
    }

    sf.clearCart()

    if (selectedPayment.value === 'paypal') {
      const payment = await ordersStore.initiatePayment(order.id)
      if (payment?.redirectUrl) {
        if (import.meta.client) window.location.href = payment.redirectUrl
        return
      }
    }

    navigateTo(`/order/confirmation?order=${order.orderNumber}`)
  } catch (e) {
    console.error('Erreur checkout:', e)
    checkoutError.value = t('checkout.step4.unexpectedError')
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <div class="checkout-page">

    <!-- Stepper premium -->
    <div class="stepper">
      <button class="back-btn" :class="{ visible: step > 1 }" @click="goBack">
        <Icon icon="solar:alt-arrow-left-line-duotone" width="25" />
      </button>

      <div class="steps">
        <div class="step-track">
          <div class="step-track-fill" :style="{ width: `${(step - 1) / 2 * 100}%` }" />
        </div>
        <div class="step-dots">
          <div
            v-for="i in 3" :key="i"
            class="step-item" :class="{ active: step === i, done: step > i }"
          >
            <div class="step-dot">
              <Icon v-if="step > i" icon="solar:check-circle-line-duotone" width="25" />
              <Icon v-else :icon="stepIcons[i - 1]" width="25" />
            </div>
            <span class="step-item-label">{{ stepLabels[i - 1] }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="checkout-content">

      <!-- Step 1 — Informations -->
      <Transition name="step" mode="out-in">
        <div v-if="step === 1" key="step1" class="step-body">
          <h2 class="step-title">{{ t('checkout.step1.title') }}</h2>
          <p class="step-sub">{{ t('checkout.step1.subtitle') }}</p>

          <div class="field-row">
            <v-text-field
              v-model="firstName" :label="t('checkout.step1.firstName')"
              variant="solo-filled" flat rounded="xl" density="comfortable"
              :error-messages="errFirstName" autocomplete="given-name" autofocus
            >
              <template #prepend-inner><Icon icon="solar:user-line-duotone" width="18" /></template>
            </v-text-field>
            <v-text-field
              v-model="lastName" :label="t('checkout.step1.lastName')"
              variant="solo-filled" flat rounded="xl" density="comfortable"
              :error-messages="errLastName" autocomplete="family-name"
            >
              <template #prepend-inner><Icon icon="solar:user-line-duotone" width="18" /></template>
            </v-text-field>
          </div>

          <v-text-field
            v-model="email" :label="t('checkout.step1.email')" type="email"
            variant="solo-filled" flat rounded="xl" density="comfortable"
            :error-messages="errEmail" autocomplete="email"
          >
            <template #prepend-inner><Icon icon="solar:letter-line-duotone" width="18" /></template>
          </v-text-field>

          <UiPhoneInput
            v-model="phone" :label="t('checkout.step1.phone')"
            :error-messages="errPhone" @keyup-enter="goNext"
          />
        </div>
      </Transition>

      <!-- Step 2 — Adresse -->
      <Transition name="step" mode="out-in">
        <div v-if="step === 2" key="step2" class="step-body">
          <h2 class="step-title">{{ t('checkout.step2.title') }}</h2>
          <p class="step-sub">{{ t('checkout.step2.subtitle') }}</p>

          <UiAddressAutocomplete
            v-model="addressLine1" :label="t('checkout.step2.address')"
            :error-messages="errAddr" @select="onAddressSelected"
          />

          <div class="field-row">
            <v-text-field
              v-model="city" :label="t('checkout.step2.city')"
              variant="solo-filled" flat rounded="xl" density="comfortable"
              :error-messages="errCity" autocomplete="address-level2"
            >
              <template #prepend-inner><Icon icon="solar:city-line-duotone" width="18" /></template>
            </v-text-field>
            <v-text-field
              v-model="postalCode" :label="t('checkout.step2.postalCode')"
              variant="solo-filled" flat rounded="xl" density="comfortable"
              :error-messages="errPostal" autocomplete="postal-code" inputmode="numeric"
            >
              <template #prepend-inner><Icon icon="solar:mailbox-line-duotone" width="18" /></template>
            </v-text-field>
          </div>

          <UiCountrySelect
            v-model="country"
            :label="t('checkout.step2.country')"
            :error-messages="errCountry"
          />
        </div>
      </Transition>

      <!-- Step 3 — Livraison + Paiement + Récap (fusionnés) -->
      <Transition name="step" mode="out-in">
        <div v-if="step === 3" key="step3" class="step-body">
          <h2 class="step-title">{{ t('checkout.step3.title') }}</h2>
          <p class="step-sub">{{ t('checkout.step3.subtitle') }}</p>

          <!-- Livraison -->
          <div v-if="loadingShippingMethods" class="inline-loading">
            <v-progress-circular indeterminate size="22" width="2" color="secondary" />
          </div>

          <div v-else-if="shippingMethodsError" class="shipping-error">
            <Icon icon="solar:danger-triangle-line-duotone" width="18" />
            <p>{{ t('checkout.step3.loadError') }}</p>
            <v-btn size="small" variant="tonal" color="secondary" rounded="xl" @click="loadShippingMethods">
              {{ t('checkout.step3.retry') }}
            </v-btn>
          </div>

          <div v-else-if="!shippingMethods.length" class="shipping-error">
            <Icon icon="solar:box-minimalistic-line-duotone" width="18" />
            <p>{{ t('checkout.step3.noMethodsAvailable') }}</p>
          </div>

          <div v-else class="shipping-options">
            <div
              v-for="method in shippingMethods" :key="method.id"
              class="shipping-card" :class="{ active: selectedShipping === method.id }"
              @click="selectedShipping = method.id"
            >
              <div class="shipping-icon">
                <Icon :icon="method.isFree ? 'solar:box-line-duotone' : 'solar:delivery-line-duotone'" width="22" />
              </div>
              <div class="shipping-info">
                <div class="shipping-name">{{ method.name }}</div>
                <div class="shipping-delay">{{ estimatedDeliveryLabel(method.minDays, method.maxDays) }}</div>
              </div>
              <div class="shipping-right">
                <div class="shipping-price">{{ method.isFree ? t('checkout.step3.free') : `${method.price.toFixed(2)}€` }}</div>
                <div class="radio-dot" :class="{ active: selectedShipping === method.id }">
                  <Icon v-if="selectedShipping === method.id" icon="solar:check-circle-bold-duotone" width="16" />
                </div>
              </div>
            </div>
          </div>

          <!-- Paiement — apparaît dès que la livraison est choisie, pas de tap supplémentaire -->
          <Transition name="fade-slide">
            <div v-if="selectedShipping" class="payment-section">
              <div class="section-divider">
                <Icon icon="solar:card-line-duotone" width="14" />
                <span>{{ t('checkout.step4.paymentSectionLabel') }}</span>
              </div>

              <div v-if="loadingPaymentMethods" class="inline-loading">
                <v-progress-circular indeterminate size="22" width="2" color="secondary" />
              </div>

              <template v-else>
                <div class="payment-options">
                  <div
                    v-for="option in paymentMethods" :key="option.method"
                    class="payment-card" :class="{ active: selectedPayment === option.method }"
                    @click="selectedPayment = option.method"
                  >
                    <div class="payment-icon">
                      <Icon :icon="paymentIcons[option.method] ?? 'solar:card-line-duotone'" width="20" />
                    </div>
                    <div class="payment-label">{{ option.label }}</div>
                    <div class="radio-dot" :class="{ active: selectedPayment === option.method }">
                      <Icon v-if="selectedPayment === option.method" icon="solar:check-circle-bold-duotone" width="16" />
                    </div>
                  </div>
                </div>

                <div v-if="selectedPayment === 'bank_transfer'" class="payment-preview-note">
                  <Icon icon="solar:info-circle-line-duotone" width="16" />
                  <p>{{ t('checkout.step4.bankTransferPreviewNote') }}</p>
                </div>

                <div v-if="selectedPayment === 'cash' && selectedPaymentDetails?.pickupAddress" class="payment-preview-note">
                  <Icon icon="solar:map-point-line-duotone" width="16" />
                  <p>{{ selectedPaymentDetails.pickupAddress }}</p>
                </div>
              </template>
            </div>
          </Transition>

          <!-- Adresse — rappel compact -->
          <div class="recap-block">
            <div class="recap-block-icon"><Icon icon="solar:map-point-line-duotone" width="16" /></div>
            <div>
              <div class="recap-label">{{ t('checkout.step4.deliverTo') }}</div>
              <div class="recap-value">{{ firstName }} {{ lastName }}</div>
              <div class="recap-sub">{{ addressLine1 }}, {{ postalCode }} {{ city }}</div>
            </div>
          </div>

          <!-- Récap articles — accordéon fermé par défaut, détail à la demande -->
          <v-expansion-panels variant="accordion" class="items-accordion">
            <v-expansion-panel rounded="xl">
              <v-expansion-panel-title>
                <div class="accordion-summary">
                  <Icon icon="solar:bag-4-line-duotone" width="18" />
                  <span>{{ t('checkout.step4.itemsCount', { count: sf.cartItems.value.length }) }}</span>
                  <span class="accordion-summary-total">{{ sf.cartTotal.value.toFixed(2) }}€</span>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="recap-items">
                  <div v-for="item in sf.cartItems.value" :key="item.variantId" class="recap-item">
                    <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.productName">
                    <div class="recap-item-info">
                      <div>{{ item.productName }}</div>
                      <div class="recap-item-meta">{{ item.variantName }} · ×{{ item.quantity }}</div>
                    </div>
                    <div class="recap-item-price">{{ (item.price * item.quantity).toFixed(2) }}€</div>
                  </div>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- Totaux -->
          <div class="recap-totals">
            <div class="recap-total-row">
              <span>{{ t('checkout.step4.subtotal') }}</span>
              <span>{{ sf.cartTotal.value.toFixed(2) }}€</span>
            </div>
            <div class="recap-total-row">
              <span>{{ t('checkout.step4.shipping') }}</span>
              <span>{{ selectedMethod?.isFree ? t('checkout.step4.shippingFree') : `${selectedMethod?.price.toFixed(2)}€` }}</span>
            </div>
            <div class="recap-total-row total">
              <span>{{ t('checkout.step4.total') }}</span>
              <span>{{ orderTotal.toFixed(2) }}€</span>
            </div>
          </div>

          <v-expand-transition>
            <div v-if="checkoutError" class="checkout-error">
              <Icon icon="solar:danger-triangle-line-duotone" width="16" />
              {{ checkoutError }}
            </div>
          </v-expand-transition>

        </div>
      </Transition>

    </div>

    <!-- CTA sticky bottom -->
    <div class="checkout-foot">
      <v-btn
        block rounded="pill" size="large"
        :color="step === 3 ? 'secondary' : 'primary'"
        :loading="paying"
        :disabled="step === 3 && !selectedPayment"
        @click="step === 3 ? onPay() : goNext()"
      >
        <template v-if="step < 3">
          {{ t('checkout.footer.continue') }}
          <Icon icon="solar:arrow-right-line-duotone" width="16" style="margin-left: 6px;" />
        </template>
        <template v-else>
          <Icon icon="solar:lock-keyhole-line-duotone" width="16" style="margin-right: 6px;" />
          {{ t('checkout.footer.payAmount', { amount: orderTotal.toFixed(2) }) }}
        </template>
      </v-btn>
      <p class="secure-label">
        <Icon icon="solar:shield-check-line-duotone" width="12" />
        {{ t('checkout.footer.secure') }}
      </p>
    </div>

  </div>
</template>

<style scoped>
.checkout-page { display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 480px; }

.stepper { display: flex; align-items: flex-start; gap: 10px; }
.back-btn {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgb(var(--v-theme-surface-variant)); border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-on-surface)); flex-shrink: 0; margin-top: 2px;
  opacity: 0; transform: scale(0.8); pointer-events: none;
  transition: opacity .2s, transform .2s;
}
.back-btn.visible { opacity: 1; transform: scale(1); pointer-events: auto; }

.steps { flex: 1; }
.step-track { height: 3px; background: rgb(var(--v-theme-outline)); border-radius: 3px; margin-bottom: 14px; overflow: hidden; }
.step-track-fill { height: 100%; background: rgb(var(--v-theme-secondary)); border-radius: 3px; transition: width .3s ease; }
.step-dots { display: flex; justify-content: space-between; }
.step-item { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.step-dot {
  width: 38px; height: 38px; border-radius: 50%;
  background: rgb(var(--v-theme-surface-variant)); display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-on-surface-variant)); transition: background .2s, color .2s, transform .2s;
}
.step-item.active .step-dot { background: rgb(var(--v-theme-secondary)); color: rgb(var(--v-theme-on-primary)); transform: scale(1.1); }
.step-item.done .step-dot { background: #4C7A4C; color: #FAFAF8; }
.step-item-label { font-size: 9.5px; font-weight: 700; color: rgb(var(--v-theme-on-surface-variant)); text-transform: uppercase; letter-spacing: 0.02em; }
.step-item.active .step-item-label { color: rgb(var(--v-theme-on-surface)); }

.checkout-content { display: flex; flex-direction: column; }
.step-body { display: flex; flex-direction: column; gap: 14px; }
.step-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 500; margin-bottom: -6px; }
.step-sub { font-size: 12.5px; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 4px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.inline-loading { display: flex; justify-content: center; padding: 24px 0; }

.shipping-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 16px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-xl);
}
.shipping-error p { font-size: 12.5px; }

.shipping-options, .payment-options { display: flex; flex-direction: column; gap: 10px; }
.shipping-card, .payment-card {
  display: flex; align-items: center; gap: 12px;
  background: rgb(var(--v-theme-surface-variant));
  border: 1.5px solid transparent; border-radius: var(--r-xl); padding: 14px 16px;
  cursor: pointer; transition: border-color .2s, transform .15s;
}
.shipping-card:active, .payment-card:active { transform: scale(0.98); }
.shipping-card.active, .payment-card.active { border-color: rgb(var(--v-theme-secondary)); }

.shipping-icon, .payment-icon {
  width: 40px; height: 40px; border-radius: var(--r-lg);
  background: rgb(var(--v-theme-surface)); display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary)); flex-shrink: 0;
}
.shipping-info { flex: 1; min-width: 0; }
.shipping-name { font-size: 13.5px; font-weight: 700; margin-bottom: 2px; }
.shipping-delay { font-size: 11.5px; color: rgb(var(--v-theme-on-surface-variant)); text-transform: capitalize; }
.shipping-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.shipping-price { font-size: 13.5px; font-weight: 700; color: rgb(var(--v-theme-secondary)); }
.payment-label { flex: 1; font-size: 13.5px; font-weight: 700; }

.radio-dot {
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid rgb(var(--v-theme-outline)); display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary)); transition: border-color .2s;
}
.radio-dot.active { border-color: transparent; }

.payment-section { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
.section-divider {
  display: flex; align-items: center; gap: 6px;
  font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  color: rgb(var(--v-theme-on-surface-variant));
}
.payment-preview-note {
  display: flex; align-items: flex-start; gap: 8px;
  background: rgba(var(--v-theme-secondary), 0.06); border-radius: var(--r-lg); padding: 12px 14px;
  font-size: 12px; color: rgb(var(--v-theme-on-surface-variant)); line-height: 1.5;
}
.payment-preview-note :deep(svg) { flex-shrink: 0; margin-top: 1px; color: rgb(var(--v-theme-secondary)); }

.recap-block {
  display: flex; gap: 12px; align-items: flex-start;
  background: rgb(var(--v-theme-surface-variant));
  border-radius: var(--r-xl); padding: 14px; margin-top: 4px;
}
.recap-block-icon {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  background: rgb(var(--v-theme-surface)); display: flex; align-items: center; justify-content: center;
  color: rgb(var(--v-theme-secondary));
}
.recap-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: rgb(var(--v-theme-on-surface-variant)); margin-bottom: 4px; }
.recap-value { font-size: 14px; font-weight: 700; }
.recap-sub { font-size: 12.5px; color: rgb(var(--v-theme-on-surface-variant)); }

.items-accordion { background: transparent !important; }
.items-accordion :deep(.v-expansion-panel) {
  background: rgb(var(--v-theme-surface-variant)) !important;
  border-radius: var(--r-xl) !important;
  overflow: hidden;
}
.items-accordion :deep(.v-expansion-panel-title) { padding: 14px 16px; min-height: unset; }
.items-accordion :deep(.v-expansion-panel-text__wrapper) { padding: 0 16px 12px; }
.accordion-summary { display: flex; align-items: center; gap: 8px; width: 100%; font-size: 13px; font-weight: 700; }
.accordion-summary-total { margin-left: auto; color: rgb(var(--v-theme-secondary)); font-weight: 700; }

.recap-items { display: flex; flex-direction: column; }
.recap-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06); }
.recap-item:last-child { border-bottom: none; }
.recap-item img { width: 40px; height: 40px; border-radius: var(--r-md); object-fit: cover; }
.recap-item-info { flex: 1; font-size: 12.5px; font-weight: 600; }
.recap-item-meta { font-size: 10.5px; color: rgb(var(--v-theme-on-surface-variant)); font-weight: 400; }
.recap-item-price { font-size: 12.5px; font-weight: 700; }

.recap-totals { margin-bottom: 4px; }
.recap-total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: rgb(var(--v-theme-on-surface-variant)); }
.recap-total-row span:last-child { font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.recap-total-row.total { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; border-top: 1px solid rgb(var(--v-theme-outline)); padding-top: 10px; margin-top: 6px; color: rgb(var(--v-theme-on-surface)); }
.recap-total-row.total span:last-child { color: rgb(var(--v-theme-secondary)); }

.checkout-error {
  display: flex; align-items: center; gap: 8px;
  background: rgba(192, 83, 62, 0.1); color: #C0533E;
  border-radius: var(--r-lg); padding: 12px; font-size: 12.5px; font-weight: 600;
}

.checkout-foot { background: rgb(var(--v-theme-surface)); }
.secure-label { display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 11px; color: rgb(var(--v-theme-on-surface-variant)); margin-top: 8px; }

.step-enter-active, .step-leave-active { transition: opacity .2s, transform .2s; }
.step-enter-from { opacity: 0; transform: translateX(20px); }
.step-leave-to   { opacity: 0; transform: translateX(-20px); }

.fade-slide-enter-active, .fade-slide-leave-active { transition: opacity .2s, transform .2s; }
.fade-slide-enter-from { opacity: 0; transform: translateY(-8px); }
.fade-slide-leave-to   { opacity: 0; transform: translateY(-8px); }

@media (min-width: 960px) {
  .step-title { font-size: 26px; }
  .step-item-label { font-size: 10.5px; }
}
</style>