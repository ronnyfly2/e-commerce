import { defineStore } from 'pinia';
import { ref, readonly } from 'vue';
import { roleApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import type { Role } from '../types';
import type { PaginationMeta } from '@/shared/types/api.types';

export const useRoleStore = defineStore('roles', () => {
  const list = ref<Role[]>([]);
  const current = ref<Role | null>(null);
  const meta = ref<PaginationMeta | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(params: { page?: number; search?: string; limit?: number } = {}) {
    isLoading.value = true; error.value = null;
    try {
      const res = await roleApi.getAll(params);
      list.value = res.items; meta.value = res.meta;
    } catch (e) { error.value = extractApiError(e); }
    finally { isLoading.value = false; }
  }

  async function fetchById(id: string) {
    isLoading.value = true; error.value = null;
    try { current.value = await roleApi.getById(id); }
    catch (e) { error.value = extractApiError(e); }
    finally { isLoading.value = false; }
  }

  function $reset() { list.value = []; current.value = null; meta.value = null; error.value = null; }

  return { list: readonly(list), current: readonly(current), meta: readonly(meta), isLoading: readonly(isLoading), error: readonly(error), fetchAll, fetchById, $reset };
});
