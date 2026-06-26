<script setup lang="ts">
import { InboxIcon } from '@heroicons/vue/24/outline';

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: 'Sin resultados',
    description: 'No hay registros que mostrar.',
  },
);
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <InboxIcon class="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
    <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ description }}</p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>
