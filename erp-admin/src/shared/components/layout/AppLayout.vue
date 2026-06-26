<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppSidebar from './AppSidebar.vue';
import AppTopBar from './AppTopBar.vue';
import { useUiStore } from '@/shared/stores/ui.store';

const ui = useUiStore();
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
    <AppSidebar />

    <div class="flex flex-1 flex-col overflow-hidden">
      <AppTopBar />

      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
