<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useUiStore } from '@/shared/stores/ui.store';
import AppToast from '@/shared/components/ui/AppToast.vue';

const ui = useUiStore();
onMounted(() => ui.initTheme());
</script>

<template>
  <AppToast />
  <RouterView />
</template>
