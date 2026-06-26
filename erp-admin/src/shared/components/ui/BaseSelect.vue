<script setup lang="ts">
defineProps<{
  label?: string;
  error?: string;
  modelValue?: string | number | null;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  options: { label: string; value: string | number }[];
}>();

defineEmits<{
  (e: 'update:modelValue', v: string | number): void;
}>();
</script>

<template>
  <div>
    <label
      v-if="label"
      class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <select
      :value="modelValue ?? ''"
      :disabled="disabled"
      class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': error }"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ error }}</p>
  </div>
</template>
