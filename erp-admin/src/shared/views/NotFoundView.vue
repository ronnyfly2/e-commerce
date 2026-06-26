<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
    <p class="text-6xl font-bold text-gray-300 dark:text-gray-700">404</p>
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Página no encontrada</h1>
    <RouterLink to="/" class="text-primary-600 underline hover:text-primary-500">
      Ir al inicio
    </RouterLink>
  </div>
</template>
