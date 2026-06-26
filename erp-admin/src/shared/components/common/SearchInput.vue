<script setup lang="ts">
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import { useDebounceFn } from '@vueuse/core';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    debounce?: number;
  }>(),
  { placeholder: 'Buscar...', debounce: 300, modelValue: '' },
);

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const debouncedEmit = useDebounceFn((v: string) => emit('update:modelValue', v), props.debounce);
</script>

<template>
  <div class="relative">
    <MagnifyingGlassIcon
      class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
    />
    <input
      type="search"
      :value="modelValue"
      :placeholder="placeholder"
      class="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      @input="debouncedEmit(($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
