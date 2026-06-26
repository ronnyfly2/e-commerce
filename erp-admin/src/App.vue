<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { Toaster } from 'vue-sonner';
import { useUiStore } from '@/shared/stores/ui.store';

const ui = useUiStore();
onMounted(() => ui.initTheme());
</script>

<template>
  <Toaster position="top-right" richColors />
  <RouterView />
</template>
