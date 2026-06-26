<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import type { PaginationMeta } from '@/shared/types/api.types';

const props = defineProps<{ meta: PaginationMeta }>();
const emit = defineEmits<{ (e: 'change', page: number): void }>();
</script>

<template>
  <div class="flex items-center justify-between py-3">
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Mostrando {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }}
      de {{ meta.total }} registros
    </p>

    <div class="flex items-center gap-1">
      <button
        type="button"
        :disabled="!meta.hasPrevPage"
        class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
        @click="emit('change', meta.page - 1)"
      >
        <ChevronLeftIcon class="h-4 w-4" />
      </button>

      <span class="px-3 text-sm text-gray-700 dark:text-gray-300">
        {{ meta.page }} / {{ meta.totalPages }}
      </span>

      <button
        type="button"
        :disabled="!meta.hasNextPage"
        class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
        @click="emit('change', meta.page + 1)"
      >
        <ChevronRightIcon class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
