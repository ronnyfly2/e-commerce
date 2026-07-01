<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { toast } from '@/shared/composables/useToast';
import { useAuthStore } from '@/shared/stores/auth.store';
import { extractApiError } from '@/shared/types/api.types';
import { inventoryApi } from '../api';
import type { ProductStock } from '../types';

const { productId } = defineProps<{ productId: string }>();

const auth = useAuthStore();
const canAdjust = auth.hasPermission('inventory:adjust');

const stocks = ref<ProductStock[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const editingId = ref<string | null>(null);
const editValue = ref(0);
const isSaving = ref(false);

const total = computed(() => stocks.value.reduce((sum, s) => sum + s.quantity, 0));

async function load() {
  isLoading.value = true;
  error.value = null;
  try {
    stocks.value = await inventoryApi.getByProduct(productId);
  } catch (e) {
    error.value = extractApiError(e);
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);

function startEdit(stock: ProductStock) {
  editingId.value = stock.id;
  editValue.value = stock.quantity;
}

function cancelEdit() {
  editingId.value = null;
}

async function saveEdit(stock: ProductStock) {
  isSaving.value = true;
  try {
    const updated = await inventoryApi.updateQuantity(stock.id, editValue.value);
    stock.quantity = updated.quantity;
    editingId.value = null;
    toast.success('Stock actualizado');
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div>
    <div v-if="isLoading" class="py-6 text-center text-sm text-gray-400">Cargando stock…</div>
    <div v-else-if="error" class="py-6 text-center text-sm text-red-500">
      {{ error }}
      <button type="button" class="ml-1 underline" @click="load">Reintentar</button>
    </div>
    <div v-else-if="stocks.length === 0" class="py-6 text-center text-sm text-gray-400">
      Sin tiendas registradas todavía.
    </div>
    <table v-else class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <th class="py-2">Tienda</th>
          <th class="py-2 text-right">Cantidad</th>
          <th v-if="canAdjust" class="py-2 text-right">Acción</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="stock in stocks"
          :key="stock.id"
          class="border-b border-gray-100 last:border-0 dark:border-gray-800"
        >
          <td class="py-2 text-gray-700 dark:text-gray-300">{{ stock.store?.name ?? '—' }}</td>
          <td class="py-2 text-right">
            <input
              v-if="editingId === stock.id"
              v-model.number="editValue"
              type="number"
              min="0"
              step="1"
              class="w-24 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <span v-else class="font-medium text-gray-900 dark:text-white">{{ stock.quantity }}</span>
          </td>
          <td v-if="canAdjust" class="py-2 text-right">
            <template v-if="editingId === stock.id">
              <button type="button" class="mr-2 text-primary-600 hover:underline disabled:opacity-50" :disabled="isSaving" @click="saveEdit(stock)">Guardar</button>
              <button type="button" class="text-gray-500 hover:underline" @click="cancelEdit">Cancelar</button>
            </template>
            <button v-else type="button" class="text-primary-600 hover:underline" @click="startEdit(stock)">Editar</button>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="border-t border-gray-200 dark:border-gray-700">
          <td class="py-2 font-semibold text-gray-900 dark:text-white">Total</td>
          <td class="py-2 text-right font-semibold text-gray-900 dark:text-white">{{ total }}</td>
          <td v-if="canAdjust" />
        </tr>
      </tfoot>
    </table>
  </div>
</template>
