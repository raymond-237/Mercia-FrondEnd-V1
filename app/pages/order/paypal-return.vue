<script setup lang="ts">
const route = useRoute()
const ordersStore = useOrdersStore()
definePageMeta({ layout: 'form' })

onMounted(async () => {
  const orderId = route.query.order as string
  await ordersStore.captureOrder(orderId)
  navigateTo(`/order-confirmation?order=${orderId}`)
})
</script>

<template>
  <div class="capturing">
    <v-progress-circular indeterminate color="secondary" />
    <p>Confirmation de votre paiement...</p>
  </div>
</template>