<script setup lang="ts">
import { useAuthStore } from '@/shared/stores/auth.store';
import PageHeader from '@/shared/components/common/PageHeader.vue';

const auth = useAuthStore();
</script>

<template>
  <div>
    <PageHeader
      title="Dashboard"
      description="Bienvenido al panel de administración del ERP"
    />

    <div class="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
      <p class="text-gray-500 dark:text-gray-400">
        Hola, <strong class="text-gray-900 dark:text-white">{{ auth.user?.email }}</strong>.
        Selecciona un módulo en el menú lateral para comenzar.
      </p>
    </div>
  </div>
</template>
