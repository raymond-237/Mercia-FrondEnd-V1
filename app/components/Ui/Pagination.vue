<script setup lang="ts">
/**
 * Composant pagination partagé — usage :
 *
 * <UiPagination v-model="currentPage" :total-pages="totalPages" />
 *
 * Remplace les blocs <v-pagination> dupliqués sur chaque page liste
 * (commandes, clients, zones, méthodes...). Se masque automatiquement
 * si une seule page existe.
 */

const props = withDefaults(defineProps<{
  modelValue: number
  totalPages: number
  totalVisible?: number
}>(), {
  totalVisible: 5,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const page = computed({
  get: () => props.modelValue,
  set: (value: number) => emit('update:modelValue', value),
})
</script>

<template>
  <div v-if="totalPages > 1" class="pagination-wrap">
    <v-pagination
      v-model="page"
      :length="totalPages"
      :total-visible="totalVisible"
      density="comfortable"
      rounded="circle"
      color="secondary"
    />
  </div>
</template>

<style scoped>
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>