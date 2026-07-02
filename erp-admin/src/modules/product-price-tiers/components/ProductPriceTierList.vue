<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { toast } from '@/shared/composables/useToast';
import { useAuthStore } from '@/shared/stores/auth.store';
import { extractApiError } from '@/shared/types/api.types';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import { productPriceTierApi } from '../api';
import type { ProductPriceTier } from '../types';

/** Without productId (product not created yet) tiers are staged locally and emitted via `update:staged`. */
const { productId, currencySymbol = '' } = defineProps<{ productId?: string; currencySymbol?: string }>();
const emit = defineEmits<{ 'update:staged': [v: { minQuantity: number; price: number }[]] }>();

const auth = useAuthStore();
const canManage = auth.hasPermission('product:update');

const tiers = ref<ProductPriceTier[]>([]);
const staged = ref<{ minQuantity: number; price: number }[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const newMinQuantity = ref<number | ''>('');
const newPrice = ref<number | ''>('');
const isAdding = ref(false);

const rows = computed(() => (productId ? tiers.value : staged.value));

async function load() {
  if (!productId) return;
  isLoading.value = true;
  error.value = null;
  try {
    tiers.value = await productPriceTierApi.getByProduct(productId);
  } catch (e) {
    error.value = extractApiError(e);
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);
watch(() => productId, load);

async function addTier() {
  const minQuantity = Number(newMinQuantity.value);
  const price = Number(newPrice.value);
  if (!minQuantity || minQuantity < 2 || !price || price <= 0) return;

  if (!productId) {
    staged.value.push({ minQuantity, price });
    staged.value.sort((a, b) => a.minQuantity - b.minQuantity);
    emit('update:staged', staged.value);
    newMinQuantity.value = '';
    newPrice.value = '';
    return;
  }

  isAdding.value = true;
  try {
    const tier = await productPriceTierApi.create({ productId, minQuantity, price });
    tiers.value = [...tiers.value, tier].sort((a, b) => a.minQuantity - b.minQuantity);
    newMinQuantity.value = '';
    newPrice.value = '';
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isAdding.value = false;
  }
}

function removeStaged(idx: number) {
  staged.value.splice(idx, 1);
  emit('update:staged', staged.value);
}

async function removeTier(tier: ProductPriceTier) {
  try {
    await productPriceTierApi.remove(tier.id);
    tiers.value = tiers.value.filter((t) => t.id !== tier.id);
  } catch (e) {
    toast.error(extractApiError(e));
  }
}
</script>

<template>
  <div>
    <p v-if="!productId" class="mb-3 text-xs text-gray-400">Se guardarán al crear el producto.</p>

    <div v-if="productId && isLoading" class="py-6 text-center text-sm text-gray-400">Cargando precios por mayor…</div>
    <div v-else-if="productId && error" class="py-6 text-center text-sm text-red-500">
      {{ error }}
      <button type="button" class="ml-1 underline" @click="load">Reintentar</button>
    </div>
    <template v-else>
      <p v-if="rows.length === 0" class="mb-3 text-xs text-gray-400">Sin precios por mayor — el producto solo tiene el precio unitario normal.</p>
      <ul v-else class="mb-3 divide-y divide-gray-100 dark:divide-gray-800">
        <li v-for="tier in tiers" :key="tier.id" class="flex items-center justify-between py-2 text-sm">
          <span class="text-gray-700 dark:text-gray-300">
            <span class="font-medium text-gray-900 dark:text-white">{{ tier.minQuantity }}+ unidades:</span>
            {{ currencySymbol }}{{ Number(tier.price).toFixed(2) }} c/u
          </span>
          <button v-if="canManage" type="button" class="text-gray-400 hover:text-red-500" @click="removeTier(tier)">
            <XMarkIcon class="h-4 w-4" />
          </button>
        </li>
        <li v-for="(tier, idx) in staged" :key="`staged-${idx}`" class="flex items-center justify-between py-2 text-sm">
          <span class="text-gray-700 dark:text-gray-300">
            <span class="font-medium text-gray-900 dark:text-white">{{ tier.minQuantity }}+ unidades:</span>
            {{ currencySymbol }}{{ tier.price.toFixed(2) }} c/u
          </span>
          <button type="button" class="text-gray-400 hover:text-red-500" @click="removeStaged(idx)">
            <XMarkIcon class="h-4 w-4" />
          </button>
        </li>
      </ul>

      <div v-if="canManage" class="flex items-end gap-2">
        <div class="w-32">
          <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">A partir de</label>
          <input
            v-model.number="newMinQuantity"
            type="number"
            min="2"
            step="1"
            placeholder="3"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            @keydown.enter.prevent="addTier"
          />
        </div>
        <div class="flex-1">
          <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">Precio unitario ({{ currencySymbol }})</label>
          <input
            v-model.number="newPrice"
            type="number"
            step="0.01"
            placeholder="0.00"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            @keydown.enter.prevent="addTier"
          />
        </div>
        <BaseButton type="button" variant="secondary" size="sm" :loading="isAdding" @click="addTier">Agregar</BaseButton>
      </div>
    </template>
  </div>
</template>
