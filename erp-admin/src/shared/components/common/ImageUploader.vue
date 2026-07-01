<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { PhotoIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import { toast } from '@/shared/composables/useToast';
import { extractApiError } from '@/shared/types/api.types';
import { uploadsApi } from '@/api/uploads';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const { modelValue, max = Infinity } = defineProps<{
  modelValue: string[];
  max?: number;
}>();

const emit = defineEmits<{ 'update:modelValue': [v: string[]] }>();

const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
const isDragging = ref(false);
const isUploading = ref(false);

const canAddMore = computed(() => modelValue.length < max);

function openPicker() {
  fileInput.value?.click();
}

async function handleFiles(fileList: FileList | null) {
  if (!fileList || fileList.length === 0) return;
  const remaining = max - modelValue.length;
  const files = Array.from(fileList).slice(0, remaining);

  const invalid = files.find((f) => !ACCEPTED_TYPES.includes(f.type) || f.size > MAX_FILE_SIZE_BYTES);
  if (invalid) {
    toast.error('Solo se permiten imágenes JPEG, PNG, WEBP o GIF de hasta 5MB');
    return;
  }

  isUploading.value = true;
  try {
    const urls = await Promise.all(files.map((f) => uploadsApi.uploadImage(f)));
    emit('update:modelValue', [...modelValue, ...urls]);
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isUploading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  handleFiles(e.dataTransfer?.files ?? null);
}

function removeImage(idx: number) {
  emit('update:modelValue', modelValue.filter((_, i) => i !== idx));
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="modelValue.length > 0" class="flex flex-wrap gap-3">
      <div v-for="(url, idx) in modelValue" :key="url" class="relative">
        <img :src="url" :alt="`Imagen ${idx + 1}`" class="h-20 w-20 rounded-lg border border-gray-200 object-cover dark:border-gray-700" />
        <button
          type="button"
          class="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
          @click="removeImage(idx)"
        >
          <XMarkIcon class="h-3 w-3" />
        </button>
      </div>
    </div>

    <div
      v-if="canAddMore"
      class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors"
      :class="isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-gray-300 dark:border-gray-600'"
      @click="openPicker"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <svg v-if="isUploading" class="h-6 w-6 animate-spin text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <PhotoIcon v-else class="h-6 w-6 text-gray-400" />
      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {{ isUploading ? 'Subiendo…' : 'Arrastra imágenes aquí o haz clic para seleccionar' }}
      </p>
      <p class="text-[11px] text-gray-400">JPEG, PNG, WEBP o GIF · máx. 5MB</p>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        :multiple="max > 1"
        class="hidden"
        @change="handleFiles(($event.target as HTMLInputElement).files)"
      />
    </div>
  </div>
</template>
