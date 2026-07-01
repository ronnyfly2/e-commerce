<script setup lang="ts">
import { Bars3Icon, MoonIcon, SunIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';
import { toast } from '@/shared/composables/useToast';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useUiStore } from '@/shared/stores/ui.store';

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();

async function handleLogout() {
  await auth.logout();
  toast.success('Sesión cerrada');
  router.push('/login');
}
</script>

<template>
  <header class="flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
    <button
      type="button"
      class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
      aria-label="Toggle sidebar"
      @click="ui.toggleSidebar()"
    >
      <Bars3Icon class="h-5 w-5" />
    </button>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        aria-label="Toggle dark mode"
        @click="ui.toggleDark()"
      >
        <MoonIcon v-if="!ui.isDark" class="h-5 w-5" />
        <SunIcon v-else class="h-5 w-5 text-yellow-400" />
      </button>

      <button
        type="button"
        class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        @click="handleLogout"
      >
        <ArrowRightOnRectangleIcon class="h-5 w-5" />
        Salir
      </button>
    </div>
  </header>
</template>
