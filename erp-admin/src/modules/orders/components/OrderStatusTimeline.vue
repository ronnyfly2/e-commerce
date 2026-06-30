<script setup lang="ts">
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/vue/24/solid';
import { ORDER_STATUS_LABELS, type OrderStatusHistory } from '../types';

defineProps<{ history: OrderStatusHistory[] }>();

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
</script>

<template>
  <ol class="relative border-l border-gray-200 dark:border-gray-700 space-y-6 pl-6">
    <li v-for="entry in history" :key="entry.id" class="relative">
      <span class="absolute -left-[1.65rem] flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900"
        :class="entry.toStatus === 'CANCELLED' || entry.toStatus === 'REFUNDED'
          ? 'bg-red-100 dark:bg-red-900/30'
          : entry.toStatus === 'COMPLETED' || entry.toStatus === 'DELIVERED'
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-primary-100 dark:bg-primary-900/30'">
        <XCircleIcon v-if="entry.toStatus === 'CANCELLED' || entry.toStatus === 'REFUNDED'"
          class="h-4 w-4 text-red-600 dark:text-red-400" />
        <CheckCircleIcon v-else-if="entry.toStatus === 'COMPLETED' || entry.toStatus === 'DELIVERED'"
          class="h-4 w-4 text-green-600 dark:text-green-400" />
        <ClockIcon v-else class="h-4 w-4 text-primary-600 dark:text-primary-400" />
      </span>

      <div class="ml-2">
        <p class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ ORDER_STATUS_LABELS[entry.toStatus] }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ formatDate(entry.createdAt) }}
          <span v-if="entry.changedByName"> · {{ entry.changedByName }}</span>
        </p>
        <p v-if="entry.notes" class="mt-1 text-xs italic text-gray-500 dark:text-gray-400">
          "{{ entry.notes }}"
        </p>
      </div>
    </li>
  </ol>
</template>
