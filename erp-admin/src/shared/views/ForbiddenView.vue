<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
    <p class="text-6xl font-bold text-red-500">403</p>
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Sin permisos</h1>
    <p class="text-gray-500">No tienes permisos para acceder a esta página.</p>
    <button
      type="button"
      class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      @click="router.back()"
    >
      Volver
    </button>
  </div>
</template>
