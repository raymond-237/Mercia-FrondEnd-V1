<script setup lang="ts">
import { OFFCANVAS_SIZE_MAP } from '~/@cores/constantes/constants';



type PropsType = {
  modelValue: boolean;
  orientation?: "left" | "right" | "top" | "bottom";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  header?: string;
  persistent?: boolean;
  hideCloseButton?: boolean;
  overlayOpacity?: number;
  transitionDuration?: number;
  expandable?: boolean;
};

const props = withDefaults(defineProps<PropsType>(), {
  modelValue: false,
  orientation: "right",
  size: "md",
  header: "",
  persistent: false,
  hideCloseButton: false,
  overlayOpacity: 0.5,
  transitionDuration: 300,
  expandable: true
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'close': [];
  'expand': [expanded: boolean];
}>();

const isExpanded = ref(false);

const drawerWidth = computed(() => {
  if (isExpanded.value && props.size !== 'full') {
    return OFFCANVAS_SIZE_MAP.xl;
  }
  return OFFCANVAS_SIZE_MAP[props.size];
});

const showExpandButton = computed(() => {
  return props.expandable && props.size !== 'full';
});

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  emit('expand', isExpanded.value);
};

const handleClose = (value: boolean) => {
  if (!value) {
    isExpanded.value = false;
    emit('close');
  }
  emit('update:modelValue', false);
};

watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    isExpanded.value = false;
  }
});
</script>

<template>
  <v-navigation-drawer
      app
      :model-value="modelValue"
      :location="orientation"
      :width="drawerWidth"
      :temporary="!persistent"
      :permanent="persistent"
      :overlay-opacity="overlayOpacity"
      :class="['offcanvas-drawer', `offcanvas-${orientation}`, { 'offcanvas-expanded': isExpanded }]"
      @update:model-value="handleClose"
  >
    <!-- Header -->
    <!-- <div class="offcanvas-header "> -->
      <!-- <div class="offcanvas-header-content">
        <h3 v-if="header" class="offcanvas-title">{{ header }}</h3>
        <v-slot name="header" />
      </div> -->

      <!-- <div class="offcanvas-actions"> -->
        <!-- Bouton agrandir/réduire -->
        <!-- <v-btn
            v-if="showExpandButton"
            icon
            variant="tonal"
            size="small"
            @click="toggleExpand"
            :title="isExpanded ? 'Agrandir': 'Réduire'"
        >
          <v-icon :icon="isExpanded ? 'mdi-arrow-collapse' : 'mdi-arrow-expand'" />
        </v-btn> -->

        <!-- Bouton fermer -->
        <!-- <v-btn
            v-if="!hideCloseButton"
            icon
            variant="elevated"
            color="error"
            size="small"
            @click="handleClose"
            :title="$t('COMMONS.CLOSE')"
        >
          <v-icon icon="mdi-close" />
        </v-btn> -->
      <!-- </div> -->
    <!-- </div> -->

    <v-divider class="opacity-100"/>

    <!-- Contenu -->
    <div class="offcanvas-content">
      <slot />
    </div>

    <!-- Footer -->
    <template v-if="$slots.footer">
      <v-divider />
      <div class="offcanvas-footer">
        <slot name="footer" />
      </div>
    </template>
  </v-navigation-drawer>
</template>



<style scoped lang="scss">
.offcanvas-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.offcanvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  min-height: 64px;
  // margin:5px;
  // border: 1px solid #059669;
  // border-radius: 25px;

}

.offcanvas-header-content {
  flex: 1;
  min-width: 0;
}

.offcanvas-title {
  font-size: 1.25rem;
  font-weight: 500;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.offcanvas-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
}

.offcanvas-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0px;
  background:   rgba(var(--v-theme-on-surface), 0.04)
}

.offcanvas-footer {
  padding: 16px 20px;
  background-color: rgba(0, 0, 0, 0.02);
}

.offcanvas-top,
.offcanvas-bottom {
  .offcanvas-content {
    max-height: calc(100vh - 140px);
  }
}

.offcanvas-drawer {
  transition: width v-bind(transitionDuration + 'ms') ease-in-out;
}

.offcanvas-expanded {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
</style>