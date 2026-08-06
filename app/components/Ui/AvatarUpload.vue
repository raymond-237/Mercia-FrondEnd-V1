<script setup>

// Props
const props = defineProps({
  modelValue: {
    type: [String, File, null],
    default: null
  },
  initialAvatar: {
    type: String,
    default: ''
  },
  sizeLimit: {
    type: Number,
    default: 5 // MB
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'upload',
  'remove',
  'error',
  'success'
])

// Références
const fileInput = ref(null)

// États
const previewUrl = ref(props.initialAvatar || '')
const temporaryPreviewUrl = ref('')
const showConfirmation = ref(false)
const selectedFile = ref(null)
const errorMessage = ref('')
const isUploading = ref(false)

// Méthodes
const triggerFileInput = () => {
  fileInput.value.click()
}

const validateFile = (file) => {
  // Vérifier le type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    throw new Error('Format non supporté. Utilisez JPG, PNG ou WebP.')
  }
  
  // Vérifier la taille (5MB max)
  const sizeLimitBytes = props.sizeLimit * 1024 * 1024
  if (file.size > sizeLimitBytes) {
    throw new Error(`Taille maximale: ${props.sizeLimit}MB`)
  }
  
  return true
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    // Validation
    validateFile(file)
    
    // Réinitialiser les erreurs
    errorMessage.value = ''
    
    // Créer une URL temporaire pour prévisualisation
    const url = URL.createObjectURL(file)
    temporaryPreviewUrl.value = url
    selectedFile.value = file
    
    // Afficher la boîte de confirmation
    showConfirmation.value = true
    
    // Réinitialiser l'input pour permettre la sélection du même fichier
    event.target.value = ''
    
  } catch (error) {
    errorMessage.value = error.message
    emit('error', error)
  }
}

const confirmUpload = async () => {
  if (!selectedFile.value) return
  
  isUploading.value = true
  
  try {
    // Nettoyer l'ancienne URL si elle existe
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl.value)
    }
    
    // Mettre à jour l'URL de prévisualisation
    previewUrl.value = temporaryPreviewUrl.value
    
    // Émettre les événements
    emit('update:modelValue', selectedFile.value)
    emit('upload', {
      file: selectedFile.value,
      previewUrl: temporaryPreviewUrl.value,
      name: selectedFile.value.name,
      size: selectedFile.value.size,
      type: selectedFile.value.type
    })
    emit('success')
    
    // Nettoyer le temporaire
    temporaryPreviewUrl.value = ''
    showConfirmation.value = false
    
    // Réinitialiser l'état
    selectedFile.value = null
    
  } catch (error) {
    errorMessage.value = 'Erreur lors de l\'upload'
    emit('error', error)
  } finally {
    isUploading.value = false
  }
}

const cancelUpload = () => {
  // Nettoyer l'URL temporaire
  if (temporaryPreviewUrl.value) {
    URL.revokeObjectURL(temporaryPreviewUrl.value)
  }
  
  // Réinitialiser
  temporaryPreviewUrl.value = ''
  selectedFile.value = null
  showConfirmation.value = false
  
  // Réinitialiser l'input file
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const removeAvatar = () => {
  // Nettoyer l'URL
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  
  // Réinitialiser
  previewUrl.value = ''
  
  // Émettre les événements
  emit('update:modelValue', null)
  emit('remove')
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue instanceof File) {
    const url = URL.createObjectURL(newValue)
    previewUrl.value = url
  } else if (typeof newValue === 'string') {
    previewUrl.value = newValue
  }
}, { immediate: true })

watch(() => props.initialAvatar, (newAvatar) => {
  if (newAvatar && !previewUrl.value) {
    previewUrl.value = newAvatar
  }
})

// Nettoyage
import { onUnmounted } from 'vue'
import { CameraIcon, CameraUpIcon, PencilIcon } from 'vue-tabler-icons'
onUnmounted(() => {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  if (temporaryPreviewUrl.value) {
    URL.revokeObjectURL(temporaryPreviewUrl.value)
  }
})
</script>

<template>
  <div class="simple-avatar-upload">
    <!-- Avatar Display -->
    <div class="avatar-display" :class="{ 'has-image': previewUrl }">
      <div class="avatar-circle" @click="triggerFileInput">
        <div v-if="previewUrl" class="avatar-image-wrapper">
          <img :src="previewUrl" alt="Avatar" class="avatar-image" />
          <div class="change-overlay">
             <camera-up-icon stroke-width="0.8"  size="80" class="mx-2"/>

            <!-- <v-icon size="24" color="white">mdi-camera</v-icon> -->
          </div>
        </div>
        <div v-else class="avatar-placeholder">
          <user-circle-icon stroke-width="0.5" size="100" class=""/>
          <!-- <v-icon size="48" color="var(--v-primary-base)">mdi-account-circle</v-icon> -->
          <!-- <span class="placeholder-text">Cliquez pour ajouter une photo</span> -->
        </div>
      </div>

      <!-- Bouton modifier si image existe -->
      <!-- <div v-if="previewUrl" class="modify-button">
        <v-btn
          icon
          size="small"
          color="error"
          variant="tonal"
          @click="triggerFileInput"
          title="Modifier la photo"
        >
              <pencil-icon stroke-width="0.5"  size="20" class=""/>
        </v-btn>
      </div> -->
    </div>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="showConfirmation" max-width="400" v-if="temporaryPreviewUrl">
      <v-card>
        <v-card-title class="d-flex align-center">
          <!-- <v-icon class="mr-2" color="primary">mdi-image</v-icon> -->
             <MoodEditIcon stroke-width="0.8"  size="50" class="mx-2"/>
          Confirmer la photo
        </v-card-title>
        <v-card-text>
          <div class="preview-container">
            <img :src="temporaryPreviewUrl" alt="Prévisualisation" class="preview-image" />
          </div>
          <p class="text-caption text-center mt-2">
            Voulez-vous utiliser cette photo comme avatar ?
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="cancelUpload" rounded="xl" color="error" variant="text">
            Annuler
          </v-btn>
          <v-btn @click="confirmUpload" size="large" rounded="xl" color="primary">
            Valider
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Input file caché -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="d-none"
      @change="handleFileSelect"
    />

    <!-- Messages d'erreur -->
    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      density="compact"
      class="mt-3"
    >
      {{ errorMessage }}
    </v-alert>

    <!-- Informations -->
    <!-- <div class="avatar-info mt-3">
      <p class="text-caption text-grey">
        <v-icon size="14" class="mr-1">mdi-information</v-icon>
        Formats acceptés : JPG, PNG, WebP
        <br>
        Taille max : 5MB • Dimensions recommandées : 400×400px
      </p>
    </div> -->
    <p
       class="text-center my-3 text-primary font-weight-bold text-h6 "
        @click="triggerFileInput"
     >
        Modifier
    </p>
  </div>
</template>



<style scoped>
.simple-avatar-upload {
  width: 100%;
}

.avatar-display {
  position: relative;
  width: 170px;
  margin: 0 auto;
}

.avatar-display.has-image {
  padding-top: 40px; /* Espace pour le bouton modifier */
}

.avatar-circle {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  margin-right: auto;
}

.avatar-circle:hover {
  transform: scale(1.03);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.avatar-image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.change-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.avatar-circle:hover .change-overlay {
  opacity: 1;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--v-primary-base);
  text-align: center;
  padding: 8px;
}

.placeholder-text {
  font-size: 9px;
  margin-top: 8px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.2;
}

.modify-button {
  position: absolute;
  top: 0;
  right: -10px;
  z-index: 2;
}

.modify-button .v-btn {
  background-color: white !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.preview-container {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8%;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.avatar-info {
  text-align: center;
  max-width: 300px;
  margin: 0 auto;
}

.avatar-info .v-icon {
  vertical-align: middle;
}

@media (max-width: 600px) {
  .avatar-display {
    width: 165px;
  }
  
  .avatar-circle {
    width: 175px;
    height: 175px;
  }
  
  .avatar-display.has-image {
    padding-top: 30px;
  }
  
  .modify-button {
    right: -5px;
  }
}
</style>