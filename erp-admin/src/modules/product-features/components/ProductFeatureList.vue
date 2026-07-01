<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { toast } from '@/shared/composables/useToast';
import { useAuthStore } from '@/shared/stores/auth.store';
import { extractApiError } from '@/shared/types/api.types';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import { productFeatureApi } from '../api';
import type { ProductFeature } from '../types';

const { productId } = defineProps<{ productId: string }>();

const auth = useAuthStore();
const canManage = auth.hasPermission('product:update');

const features = ref<ProductFeature[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const newName = ref('');
const newValue = ref('');
const isAdding = ref(false);

async function load() {
  isLoading.value = true;
  error.value = null;
  try {
    features.value = await productFeatureApi.getByProduct(productId);
  } catch (e) {
    error.value = extractApiError(e);
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);

async function addFeature() {
  const name = newName.value.trim();
  const value = newValue.value.trim();
  if (!name || !value) return;
  isAdding.value = true;
  try {
    const feature = await productFeatureApi.create({
      productId, name, value, sortOrder: features.value.length,
    });
    features.value.push(feature);
    newName.value = '';
    newValue.value = '';
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isAdding.value = false;
  }
}

async function removeFeature(feature: ProductFeature) {
  try {
    await productFeatureApi.remove(feature.id);
    features.value = features.value.filter((f) => f.id !== feature.id);
  } catch (e) {
    toast.error(extractApiError(e));
  }
}
</script>

<template>
  <div>
    <div v-if="isLoading" class="py-6 text-center text-sm text-gray-400">Cargando características…</div>
    <div v-else-if="error" class="py-6 text-center text-sm text-red-500">
      {{ error }}
      <button type="button" class="ml-1 underline" @click="load">Reintentar</button>
    </div>
    <template v-else>
      <p v-if="features.length === 0" class="mb-3 text-xs text-gray-400">Sin características aún</p>
      <ul v-else class="mb-3 divide-y divide-gray-100 dark:divide-gray-800">
        <li v-for="feature in features" :key="feature.id" class="flex items-center justify-between py-2 text-sm">
          <span class="text-gray-700 dark:text-gray-300">
            <span class="font-medium text-gray-900 dark:text-white">{{ feature.name }}:</span>
            {{ feature.value }}
          </span>
          <button
            v-if="canManage"
            type="button"
            class="text-gray-400 hover:text-red-500"
            @click="removeFeature(feature)"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </li>
      </ul>

      <div v-if="canManage" class="flex gap-2">
        <input
          v-model="newName"
          type="text"
          placeholder="Nombre (ej. Material)"
          class="w-1/3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          @keydown.enter.prevent="addFeature"
        />
        <input
          v-model="newValue"
          type="text"
          placeholder="Valor (ej. Cuero genuino)"
          class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          @keydown.enter.prevent="addFeature"
        />
        <BaseButton type="button" variant="secondary" size="sm" :loading="isAdding" @click="addFeature">Agregar</BaseButton>
      </div>
    </template>
  </div>
</template>
