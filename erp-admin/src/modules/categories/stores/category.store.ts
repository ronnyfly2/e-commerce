import { defineStore } from 'pinia';
import { ref, readonly } from 'vue';
import { categoryApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import type { Category } from '../types';
import type { PaginationMeta } from '@/shared/types/api.types';

export const useCategoryStore = defineStore('categories', () => {
  const list = ref<Category[]>([]);
  const tree = ref<Category[]>([]);
  const current = ref<Category | null>(null);
  const meta = ref<PaginationMeta | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(params: { page?: number; search?: string; limit?: number } = {}) {
    isLoading.value = true; error.value = null;
    try {
      const res = await categoryApi.getAll(params);
      list.value = res.items; meta.value = res.meta;
    } catch (e) { error.value = extractApiError(e); }
    finally { isLoading.value = false; }
  }

  async function fetchTree() {
    isLoading.value = true; error.value = null;
    try { tree.value = await categoryApi.getTree(); }
    catch (e) { error.value = extractApiError(e); }
    finally { isLoading.value = false; }
  }

  async function fetchById(id: string) {
    isLoading.value = true; error.value = null;
    try { current.value = await categoryApi.getById(id); }
    catch (e) { error.value = extractApiError(e); }
    finally { isLoading.value = false; }
  }

  function $reset() { list.value = []; tree.value = []; current.value = null; meta.value = null; error.value = null; }

  return { list: readonly(list), tree: readonly(tree), current: readonly(current), meta: readonly(meta), isLoading: readonly(isLoading), error: readonly(error), fetchAll, fetchTree, fetchById, $reset };
});
