<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline';

withDefaults(
  defineProps<{
    message?: string;
  }>(),
  { message: 'Ocurrió un error inesperado.' },
);

defineEmits<{ (e: 'retry'): void }>();
</script>

<template>
  <div class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
    <div class="flex items-start gap-3">
      <ExclamationTriangleIcon class="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      <div class="flex-1">
        <p class="text-sm text-red-700 dark:text-red-400">{{ message }}</p>
        <button
          type="button"
          class="mt-2 text-xs font-medium text-red-600 underline hover:text-red-500 dark:text-red-400"
          @click="$emit('retry')"
        >
          Reintentar
        </button>
      </div>
    </div>
  </div>
</template>
