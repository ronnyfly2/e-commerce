<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from '@/shared/composables/useToast';
import { productApi } from '../api';
import { categoryApi } from '@/modules/categories/api';
import { brandApi } from '@/modules/brands/api';
import ProductStockTable from '@/modules/inventory/components/ProductStockTable.vue';
import ProductFeatureList from '@/modules/product-features/components/ProductFeatureList.vue';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import ImageUploader from '@/shared/components/common/ImageUploader.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;

const categoryOptions = ref<{ label: string; value: string }[]>([]);
const brandOptions = ref<{ label: string; value: string }[]>([{ label: '— Sin marca —', value: '' }]);
const images = ref<string[]>([]);

const schema = toTypedSchema(z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones').max(255),
  description: z.string().optional(),
  price: z.coerce.number().positive('El precio debe ser positivo'),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal('')),
  costPrice: z.coerce.number().positive().optional().or(z.literal('')),
  minStock: z.coerce.number().int().min(0),
  categoryId: z.string().uuid('Selecciona una categoría'),
  brandId: z.string().uuid().optional().or(z.literal('')),
}));

const { handleSubmit, isSubmitting, setValues } = useForm({ validationSchema: schema });
const { value: sku, errorMessage: skuError } = useField<string>('sku');
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: slug, errorMessage: slugError } = useField<string>('slug');
const { value: description } = useField<string>('description');
const { value: price, errorMessage: priceError } = useField<number>('price');
const { value: compareAtPrice } = useField<number | ''>('compareAtPrice');
const { value: costPrice } = useField<number | ''>('costPrice');
const { value: minStock } = useField<number>('minStock');
const { value: categoryId, errorMessage: categoryError } = useField<string>('categoryId');
const { value: brandId } = useField<string>('brandId');

onMounted(async () => {
  const [cats, brands] = await Promise.all([categoryApi.getAll({ limit: 100 }), brandApi.getAll({ limit: 100 })]);
  categoryOptions.value = cats.items.map((c) => ({ label: c.name, value: c.id }));
  brandOptions.value.push(...brands.items.map((b) => ({ label: b.name, value: b.id })));

  if (isEdit && id) {
    const p = await productApi.getById(id);
    images.value = [...(p.images ?? [])];
    setValues({
      sku: p.sku, name: p.name, slug: p.slug, description: p.description ?? '',
      price: Number(p.price), compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : '',
      costPrice: p.costPrice ? Number(p.costPrice) : '', minStock: p.minStock,
      categoryId: p.categoryId, brandId: p.brandId ?? '',
    });
  } else {
    setValues({ minStock: 0, brandId: '' });
  }
});

function autoSlug(val: string) {
  if (!isEdit) slug.value = val.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      ...values,
      brandId: values.brandId || undefined,
      compareAtPrice: values.compareAtPrice !== '' ? Number(values.compareAtPrice) : undefined,
      costPrice: values.costPrice !== '' ? Number(values.costPrice) : undefined,
      description: values.description || undefined,
      images: images.value,
    };
    if (isEdit && id) { await productApi.update(id, payload); toast.success('Producto actualizado'); }
    else { await productApi.create(payload as Parameters<typeof productApi.create>[0]); toast.success('Producto creado'); }
    router.push('/products');
  } catch (e) { toast.error(extractApiError(e)); }
});
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <PageHeader :title="isEdit ? 'Editar producto' : 'Nuevo producto'">
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>
    <div class="space-y-6">
      <!-- Información básica -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Información básica</h3>
        <div class="space-y-4">
          <BaseInput v-model="name" label="Nombre" placeholder="Nombre del producto" :error="nameError" required @update:model-value="autoSlug" />
          <BaseInput v-model="slug" label="Slug" placeholder="nombre-del-producto" :error="slugError" required />
          <BaseInput v-model="sku" label="SKU" placeholder="PROD-001" :error="skuError" required />
          <BaseInput v-model="description" label="Descripción" placeholder="Descripción opcional" />
        </div>
      </div>

      <!-- Clasificación -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Clasificación</h3>
        <div class="grid grid-cols-2 gap-4">
          <BaseSelect v-model="categoryId" label="Categoría" placeholder="Selecciona una categoría" :options="categoryOptions" :error="categoryError" required />
          <BaseSelect v-model="brandId" label="Marca" :options="brandOptions" />
        </div>
      </div>

      <!-- Precios -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Precios</h3>
        <div class="grid grid-cols-3 gap-4">
          <BaseInput v-model.number="price" label="Precio de venta" type="number" step="0.01" placeholder="0.00" :error="priceError" required />
          <BaseInput v-model.number="compareAtPrice" label="Precio comparativo" type="number" step="0.01" placeholder="0.00" hint="Precio tachado" />
          <BaseInput v-model.number="costPrice" label="Costo" type="number" step="0.01" placeholder="0.00" />
        </div>
      </div>

      <!-- Inventario -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Inventario</h3>
        <div class="w-40">
          <BaseInput v-model.number="minStock" label="Stock mínimo" type="number" step="1" placeholder="0" hint="Umbral de alerta" />
        </div>
        <p v-if="!isEdit" class="mt-3 text-xs text-gray-400">
          El stock disponible se gestiona por tienda una vez creado el producto.
        </p>
      </div>

      <!-- Stock por tienda -->
      <div v-if="isEdit && id" class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Stock por tienda</h3>
        <ProductStockTable :product-id="id" />
      </div>

      <!-- Características -->
      <div v-if="isEdit && id" class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Características</h3>
        <ProductFeatureList :product-id="id" />
      </div>

      <!-- Imágenes -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Imágenes</h3>
        <ImageUploader v-model="images" />
      </div>

      <div class="flex justify-end gap-3">
        <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
        <BaseButton :loading="isSubmitting" @click="onSubmit">{{ isEdit ? 'Guardar cambios' : 'Crear producto' }}</BaseButton>
      </div>
    </div>
  </div>
</template>
