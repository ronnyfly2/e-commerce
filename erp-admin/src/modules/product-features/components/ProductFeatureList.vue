<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { toast } from '@/shared/composables/useToast';
import { useAuthStore } from '@/shared/stores/auth.store';
import { extractApiError } from '@/shared/types/api.types';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import { productFeatureApi } from '../api';
import type { ProductFeature } from '../types';

const FEATURE_SUGGESTIONS: { match: RegExp; features: string[] }[] = [
  { match: /ropa|vestimenta|moda|prendas/i, features: ['Talla', 'Material', 'Género', 'Temporada'] },
  { match: /calzado|zapatos|zapatillas/i, features: ['Talla', 'Material', 'Género'] },
  { match: /electr[oó]nica|tecnolog[ií]a|c[oó]mputo/i, features: ['Voltaje', 'Garantía', 'Conectividad'] },
  { match: /mueble|hogar/i, features: ['Material', 'Dimensiones', 'Acabado'] },
  { match: /aliment|comida|bebida/i, features: ['Fecha de vencimiento', 'Ingredientes', 'Calorías'] },
  { match: /belleza|cosm[eé]tico/i, features: ['Tipo de piel', 'Volumen', 'Ingredientes'] },
];

/** Without productId (product not created yet) features are staged locally and emitted via `update:staged`. */
const { productId, categoryPath = [] } = defineProps<{ productId?: string; categoryPath?: string[] }>();
const emit = defineEmits<{ 'update:staged': [v: { name: string; value: string }[]] }>();

const auth = useAuthStore();
const canManage = auth.hasPermission('product:update');

const features = ref<ProductFeature[]>([]);
const staged = ref<{ name: string; value: string }[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const newName = ref('');
const newValue = ref('');
const isAdding = ref(false);

const currentNames = computed(() =>
  productId ? features.value.map((f) => f.name) : staged.value.map((f) => f.name),
);

const suggestions = computed(() => {
  if (categoryPath.length === 0) return [];
  const matched = FEATURE_SUGGESTIONS.filter((s) => categoryPath.some((name) => s.match.test(name)));
  const existing = new Set(currentNames.value.map((n) => n.toLowerCase()));
  const names = matched.flatMap((s) => s.features);
  return [...new Set(names)].filter((n) => !existing.has(n.toLowerCase()));
});

function applySuggestion(name: string) {
  newName.value = name;
}

async function load() {
  if (!productId) return;
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
watch(() => productId, load);

async function addFeature() {
  const name = newName.value.trim();
  const value = newValue.value.trim();
  if (!name || !value) return;

  if (!productId) {
    staged.value.push({ name, value });
    emit('update:staged', staged.value);
    newName.value = '';
    newValue.value = '';
    return;
  }

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

function removeStaged(idx: number) {
  staged.value.splice(idx, 1);
  emit('update:staged', staged.value);
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
    <p v-if="!productId" class="mb-3 text-xs text-gray-400">
      Se guardarán al crear el producto.
    </p>

    <div v-if="productId && isLoading" class="py-6 text-center text-sm text-gray-400">Cargando características…</div>
    <div v-else-if="productId && error" class="py-6 text-center text-sm text-red-500">
      {{ error }}
      <button type="button" class="ml-1 underline" @click="load">Reintentar</button>
    </div>
    <template v-else>
      <p v-if="currentNames.length === 0" class="mb-3 text-xs text-gray-400">Sin características aún</p>
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
        <li v-for="(feature, idx) in staged" :key="`staged-${idx}`" class="flex items-center justify-between py-2 text-sm">
          <span class="text-gray-700 dark:text-gray-300">
            <span class="font-medium text-gray-900 dark:text-white">{{ feature.name }}:</span>
            {{ feature.value }}
          </span>
          <button type="button" class="text-gray-400 hover:text-red-500" @click="removeStaged(idx)">
            <XMarkIcon class="h-4 w-4" />
          </button>
        </li>
      </ul>

      <div v-if="canManage && suggestions.length > 0" class="mb-3 flex flex-wrap gap-1.5">
        <button
          v-for="s in suggestions"
          :key="s"
          type="button"
          class="rounded-full border border-dashed border-primary-400 px-2.5 py-1 text-xs text-primary-600 hover:bg-primary-50 dark:border-primary-500 dark:text-primary-400 dark:hover:bg-primary-950"
          @click="applySuggestion(s)"
        >
          + {{ s }}
        </button>
      </div>

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
