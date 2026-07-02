<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { toast } from '@/shared/composables/useToast';
import { productBundleApi } from '../api';
import { productApi } from '@/modules/products/api';
import { currencyApi } from '@/modules/currencies/api';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import ImageUploader from '@/shared/components/common/ImageUploader.vue';

interface ItemRow { productId: string; name: string; sku: string; quantity: number }

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;

const productOptions = ref<{ label: string; value: string }[]>([]);
const productsById = new Map<string, { name: string; sku: string }>();
const image = ref<string[]>([]);
const items = ref<ItemRow[]>([]);
const pickedProductId = ref('');
const pickedQuantity = ref(1);
const currencySymbol = ref('');

const availableOptions = computed(() =>
  productOptions.value.filter((o) => !items.value.some((i) => i.productId === o.value)),
);

const schema = toTypedSchema(z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.coerce.number().positive('El precio debe ser positivo'),
}));

const { handleSubmit, isSubmitting, setValues } = useForm({ validationSchema: schema });
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: description } = useField<string>('description');
const { value: price, errorMessage: priceError } = useField<number>('price');

onMounted(async () => {
  const [products, currencies] = await Promise.all([
    productApi.getAll({ limit: 100 }),
    currencyApi.getAll(),
  ]);
  productOptions.value = products.items.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id }));
  products.items.forEach((p) => productsById.set(p.id, { name: p.name, sku: p.sku }));
  currencySymbol.value = currencies.find((c) => c.isDefault)?.symbol ?? currencies[0]?.symbol ?? '';

  if (isEdit && id) {
    const b = await productBundleApi.getById(id);
    setValues({ name: b.name, description: b.description ?? '', price: Number(b.price) });
    image.value = b.imageUrl ? [b.imageUrl] : [];
    items.value = b.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      name: i.product?.name ?? productsById.get(i.productId)?.name ?? '—',
      sku: i.product?.sku ?? productsById.get(i.productId)?.sku ?? '',
    }));
  }
});

function addItem() {
  if (!pickedProductId.value || pickedQuantity.value < 1) return;
  const p = productsById.get(pickedProductId.value);
  if (!p) return;
  items.value.push({ productId: pickedProductId.value, quantity: pickedQuantity.value, ...p });
  pickedProductId.value = '';
  pickedQuantity.value = 1;
}

function removeItem(idx: number) {
  items.value.splice(idx, 1);
}

const onSubmit = handleSubmit(async (values) => {
  if (items.value.length === 0) {
    toast.error('Agrega al menos un producto al paquete');
    return;
  }
  try {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      price: values.price,
      imageUrl: image.value[0] || undefined,
      items: items.value.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };
    if (isEdit && id) { await productBundleApi.update(id, payload); toast.success('Paquete actualizado'); }
    else { await productBundleApi.create(payload); toast.success('Paquete creado'); }
    router.push('/bundles');
  } catch (e) { toast.error(extractApiError(e)); }
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader :title="isEdit ? 'Editar paquete' : 'Nuevo paquete'">
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>
    <div class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Información del paquete</h3>
        <div class="space-y-4">
          <BaseInput v-model="name" label="Nombre" placeholder="Pack 3 poleras" :error="nameError" required />
          <BaseInput v-model="description" label="Descripción" placeholder="Descripción opcional" />
          <div class="w-40">
            <BaseInput v-model.number="price" :label="`Precio del paquete (${currencySymbol})`" type="number" step="0.01" placeholder="0.00" :error="priceError" required hint="Precio fijo por todo el paquete" />
          </div>
          <div>
            <p class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Imagen</p>
            <ImageUploader v-model="image" :max="1" />
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Productos del paquete</h3>
        <p v-if="items.length === 0" class="mb-3 text-xs text-gray-400">Agrega los productos (o variantes de color) que forman este paquete.</p>
        <ul v-else class="mb-3 divide-y divide-gray-100 dark:divide-gray-800">
          <li v-for="(item, idx) in items" :key="item.productId" class="flex items-center justify-between py-2 text-sm">
            <span class="text-gray-700 dark:text-gray-300">
              <span class="font-medium text-gray-900 dark:text-white">{{ item.quantity }}× {{ item.name }}</span>
              <span class="text-gray-400"> ({{ item.sku }})</span>
            </span>
            <button type="button" class="text-gray-400 hover:text-red-500" @click="removeItem(idx)">
              <XMarkIcon class="h-4 w-4" />
            </button>
          </li>
        </ul>
        <div class="flex items-end gap-2">
          <div class="flex-1">
            <BaseSelect v-model="pickedProductId" label="Producto" placeholder="Selecciona un producto" :options="availableOptions" />
          </div>
          <div class="w-24">
            <BaseInput v-model.number="pickedQuantity" label="Cant." type="number" min="1" step="1" />
          </div>
          <BaseButton type="button" variant="secondary" size="sm" @click="addItem">Agregar</BaseButton>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
        <BaseButton :loading="isSubmitting" @click="onSubmit">{{ isEdit ? 'Guardar cambios' : 'Crear paquete' }}</BaseButton>
      </div>
    </div>
  </div>
</template>
