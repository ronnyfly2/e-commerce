import { defineStore } from 'pinia';
import { ref, readonly } from 'vue';
import { productApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import type { Product } from '../types';
import type { ProductQuery } from '../api';
import type { PaginationMeta } from '@/shared/types/api.types';

export const useProductStore = defineStore('products', () => {
  const list = ref<Product[]>([]);
  const current = ref<Product | null>(null);
  const meta = ref<PaginationMeta | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(params: ProductQuery = {}) {
    isLoading.value = true; error.value = null;
    try {
      const res = await productApi.getAll(params);
      list.value = res.items; meta.value = res.meta;
    } catch (e) { error.value = extractApiError(e); }
    finally { isLoading.value = false; }
  }

  async function fetchById(id: string) {
    isLoading.value = true; error.value = null;
    try { current.value = await productApi.getById(id); }
    catch (e) { error.value = extractApiError(e); }
    finally { isLoading.value = false; }
  }

  function $reset() { list.value = []; current.value = null; meta.value = null; error.value = null; }

  return { list: readonly(list), current: readonly(current), meta: readonly(meta), isLoading: readonly(isLoading), error: readonly(error), fetchAll, fetchById, $reset };
});
