import { defineStore } from 'pinia';
import { ref, readonly } from 'vue';
import type { PaginationMeta } from '@/shared/types/api.types';
import { extractApiError } from '@/shared/types/api.types';
import { orderApi } from '../api';
import type { Order, OrderFilters } from '../types';

export const useOrderStore = defineStore('orders', () => {
  const list = ref<Order[]>([]);
  const current = ref<Order | null>(null);
  const meta = ref<PaginationMeta | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(filters?: OrderFilters) {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await orderApi.getAll(filters);
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
      current.value = await orderApi.getById(id);
    } catch (e) {
      error.value = extractApiError(e);
    } finally {
      isLoading.value = false;
    }
  }

  function setCurrent(order: Order) {
    current.value = order;
  }

  return {
    list: readonly(list),
    current: readonly(current),
    meta: readonly(meta),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchAll,
    fetchById,
    setCurrent,
  };
});
