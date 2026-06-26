import { defineStore } from 'pinia';
import { ref, readonly } from 'vue';
import type { PaginationMeta } from '@/shared/types/api.types';
import { extractApiError } from '@/shared/types/api.types';
import { branchApi } from '../api';
import type { Branch } from '../types';

export const useBranchStore = defineStore('branches', () => {
  const list = ref<Branch[]>([]);
  const current = ref<Branch | null>(null);
  const meta = ref<PaginationMeta | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(params?: { page?: number; limit?: number; search?: string }) {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await branchApi.getAll(params);
      list.value = res.items;
      meta.value = res.meta;
    } catch (e) {
      error.value = extractApiError(e);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchById(id: string) {
    isLoading.value = true;
    error.value = null;
    try {
      current.value = await branchApi.getById(id);
    } catch (e) {
      error.value = extractApiError(e);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    list: readonly(list),
    current: readonly(current),
    meta: readonly(meta),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchAll,
    fetchById,
  };
});
