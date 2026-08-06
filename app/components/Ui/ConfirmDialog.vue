<script setup lang="ts">


type PropsType = {
  modelValue: boolean; // Contrôle l'ouverture/fermeture via v-model
};

const props = withDefaults(
    defineProps<PropsType>(),
     {
   modelValue : false,
});

const emit = defineEmits(["update:modelValue","on-confirm","on-cancel"]);

const dialog = computed<boolean>({
                    get: () => props.modelValue,
                    set: (value : boolean) => {
                        emit("update:modelValue", value);
                    },
                });



const slots = useSlots();




const handleCancel = (event : any) => {
    emit("on-cancel")
    dialog.value = false;
}

const handleConfirm = (event : any) => {
     emit("on-confirm")   
}


</script>

<template>

    <v-dialog v-model="dialog"
              max-width="400"
              style="z-index: 100000"
             persistent>
<!--        <template v-slot:activator="{ props: activatorProps }">-->
<!--            <slot v-bind="activatorProps"/>-->
<!--        </template>-->
                <v-card rounded="lg">

                <template v-slot:prepend>
                    <slot name="icon"/>
                    <v-icon v-if="!slots['icon']" size="30" 
                    icon="mdi-help-circle-outline" class="text-primary"/>
                </template>

                <template v-slot:title>
                    <slot name="header"/>
                    <h5 v-if="!slots['header']" 
                    class="text-body-6">Confirmation</h5>
                </template>

                <template v-slot:text>
                    <slot name="body"/>
                    <p v-if="!slots['body']" class="text-body-6">Confirmer cette action?</p>
                </template>


                <template v-slot:actions>
                    <v-spacer></v-spacer>

                    <v-btn v-if="!slots['no-button']"
                        variant="outlined"
                        color="secondary"
                        height="40"
                        class="text-transform-none"
                        @click="handleCancel">
                        Non
                    </v-btn>


                    <slot name="no-button"/>
                    <slot name="yes-button"/>

                    <v-btn v-if="!slots['yes-button']"
                        color="primary"
                        height="40"
                        class="text-transform-none bg-primary text-white"
                        @click="handleConfirm">
                        Oui
                    </v-btn>

                </template>
                </v-card>
    </v-dialog>

</template>