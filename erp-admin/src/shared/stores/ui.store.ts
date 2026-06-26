import { defineStore } from 'pinia';
import { ref, readonly } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(true);
  const isDark = ref(false);

  function toggleSidebar(): void {
    sidebarOpen.value = !sidebarOpen.value;
  }

  function toggleDark(): void {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle('dark', isDark.value);
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  }

  function initTheme(): void {
    const saved = localStorage.getItem('theme');
    isDark.value = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark.value);
  }

  return {
    sidebarOpen: readonly(sidebarOpen),
    isDark: readonly(isDark),
    toggleSidebar,
    toggleDark,
    initTheme,
  };
});
