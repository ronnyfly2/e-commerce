<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from '@/shared/composables/useToast';
import { productApi } from '../api';
import { PRODUCT_UNITS, type ProductUnit } from '../types';
import { categoryApi } from '@/modules/categories/api';
import type { Category } from '@/modules/categories/types';
import { brandApi } from '@/modules/brands/api';
import { currencyApi } from '@/modules/currencies/api';
import type { Currency } from '@/modules/currencies/types';
import ProductStockTable from '@/modules/inventory/components/ProductStockTable.vue';
import ProductFeatureList from '@/modules/product-features/components/ProductFeatureList.vue';
import { productFeatureApi } from '@/modules/product-features/api';
import ProductPriceTierList from '@/modules/product-price-tiers/components/ProductPriceTierList.vue';
import { productPriceTierApi } from '@/modules/product-price-tiers/api';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import ImageUploader from '@/shared/components/common/ImageUploader.vue';
import ColorPicker from '@/shared/components/common/ColorPicker.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;

const categories = ref<Category[]>([]);
const categoryOptions = ref<{ label: string; value: string }[]>([]);
const brandOptions = ref<{ label: string; value: string }[]>([{ label: '— Sin marca —', value: '' }]);
const unitOptions = PRODUCT_UNITS.map((u) => ({ label: u.label, value: u.value }));
const images = ref<string[]>([]);
const stagedFeatures = ref<{ name: string; value: string }[]>([]);
const stagedPriceTiers = ref<{ minQuantity: number; price: number }[]>([]);
const defaultCurrency = ref<Currency | null>(null);

const schema = toTypedSchema(z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones').max(255),
  description: z.string().optional(),
  price: z.coerce.number().positive('El precio debe ser positivo'),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal('')),
  costPrice: z.coerce.number().positive().optional().or(z.literal('')),
  minStock: z.coerce.number().int().min(0),
  color: z.string().optional(),
  weight: z.coerce.number().min(0).optional().or(z.literal('')),
  unit: z.enum(PRODUCT_UNITS.map((u) => u.value) as [ProductUnit, ...ProductUnit[]]),
  categoryId: z.string().uuid('Selecciona una categoría'),
  brandId: z.string().uuid().optional().or(z.literal('')),
  pointsAwarded: z.coerce.number().int().min(0),
}));

// Defaults go through initialValues (not setValues) — setValues validates the whole form immediately,
// which would show "required" errors on sku/name/slug/price/categoryId before the user touches anything.
const { handleSubmit, isSubmitting, setValues } = useForm({
  validationSchema: schema,
  initialValues: { minStock: 0, brandId: '', unit: 'unit', pointsAwarded: 0 },
});
const { value: sku, errorMessage: skuError } = useField<string>('sku');
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: slug, errorMessage: slugError } = useField<string>('slug');
const { value: description } = useField<string>('description');
const { value: price, errorMessage: priceError } = useField<number>('price');
const { value: compareAtPrice } = useField<number | ''>('compareAtPrice');
const { value: costPrice } = useField<number | ''>('costPrice');
const { value: minStock } = useField<number>('minStock');
const { value: color } = useField<string>('color');
const { value: weight } = useField<number | ''>('weight');
const { value: unit } = useField<ProductUnit>('unit');
const { value: categoryId, errorMessage: categoryError } = useField<string>('categoryId');
const { value: brandId } = useField<string>('brandId');
const { value: pointsAwarded } = useField<number>('pointsAwarded');

/** Includes the selected category and every ancestor up the tree, e.g. ["Polo", "Ropa"] — so category-based
 * suggestions (talla, material…) also trigger from a parent category, not just an exact match. */
const selectedCategoryPath = computed(() => {
  const path: string[] = [];
  const seen = new Set<string>();
  let current = categories.value.find((c) => c.id === categoryId.value);
  while (current && !seen.has(current.id)) {
    path.push(current.name);
    seen.add(current.id);
    current = current.parentId ? categories.value.find((c) => c.id === current!.parentId) : undefined;
  }
  return path;
});

const currencySymbol = computed(() => defaultCurrency.value?.symbol ?? '');

/** exchangeRate is "1 USD = N <currency>" (see currencies module), so dividing converts back to USD. */
function toUsd(amount: number | '' | undefined): string | null {
  if (amount === '' || amount === undefined || Number.isNaN(amount) || !defaultCurrency.value) return null;
  return (amount / defaultCurrency.value.exchangeRate).toFixed(2);
}

onMounted(async () => {
  const [cats, brands, currencies] = await Promise.all([
    categoryApi.getAll({ limit: 100 }),
    brandApi.getAll({ limit: 100 }),
    currencyApi.getAll(),
  ]);
  categories.value = cats.items;
  categoryOptions.value = cats.items.map((c) => ({ label: c.name, value: c.id }));
  brandOptions.value.push(...brands.items.map((b) => ({ label: b.name, value: b.id })));
  defaultCurrency.value = currencies.find((c) => c.isDefault) ?? currencies[0] ?? null;

  if (isEdit && id) {
    const p = await productApi.getById(id);
    images.value = [...(p.images ?? [])];
    setValues({
      sku: p.sku, name: p.name, slug: p.slug, description: p.description ?? '',
      price: Number(p.price), compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : '',
      costPrice: p.costPrice ? Number(p.costPrice) : '', minStock: p.minStock,
      color: p.color ?? '', weight: p.weight ?? '', unit: p.unit,
      categoryId: p.categoryId, brandId: p.brandId ?? '',
      pointsAwarded: p.pointsAwarded,
    });
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
      weight: values.weight !== '' ? Number(values.weight) : undefined,
      color: values.color || undefined,
      description: values.description || undefined,
      images: images.value,
    };
    if (isEdit && id) {
      await productApi.update(id, payload);
      toast.success('Producto actualizado');
    } else {
      const created = await productApi.create(payload as Parameters<typeof productApi.create>[0]);
      await Promise.all([
        ...stagedFeatures.value.map((f, idx) =>
          productFeatureApi.create({ productId: created.id, name: f.name, value: f.value, sortOrder: idx })),
        ...stagedPriceTiers.value.map((t) =>
          productPriceTierApi.create({ productId: created.id, minQuantity: t.minQuantity, price: t.price })),
      ]);
      toast.success('Producto creado');
    }
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
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          Precios
          <span v-if="defaultCurrency" class="font-normal text-gray-400">({{ defaultCurrency.code }} {{ currencySymbol }})</span>
        </h3>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <BaseInput
              v-model.number="price"
              :label="`Precio de venta (${currencySymbol})`"
              type="number"
              step="0.01"
              placeholder="0.00"
              :error="priceError"
              required
            />
            <p v-if="toUsd(price)" class="mt-1 text-xs text-gray-400">≈ ${{ toUsd(price) }} USD</p>
          </div>
          <div>
            <BaseInput
              v-model.number="compareAtPrice"
              :label="`Precio original (${currencySymbol})`"
              type="number"
              step="0.01"
              placeholder="0.00"
              hint="Opcional. Para poner el producto en oferta, coloca aquí el precio anterior — se mostrará tachado junto al precio de venta"
            />
            <p v-if="toUsd(compareAtPrice)" class="mt-1 text-xs text-gray-400">≈ ${{ toUsd(compareAtPrice) }} USD</p>
          </div>
          <div>
            <BaseInput
              v-model.number="costPrice"
              :label="`Costo (${currencySymbol})`"
              type="number"
              step="0.01"
              placeholder="0.00"
              hint="Lo que te cuesta comprar o producir el artículo — no se muestra al cliente, sirve para calcular tu margen"
            />
            <p v-if="toUsd(costPrice)" class="mt-1 text-xs text-gray-400">≈ ${{ toUsd(costPrice) }} USD</p>
          </div>
        </div>
      </div>

      <!-- Puntos de fidelidad -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Puntos de fidelidad</h3>
        <div class="w-40">
          <BaseInput
            v-model.number="pointsAwarded"
            label="Puntos por unidad"
            type="number"
            step="1"
            placeholder="0"
            hint="Puntos que gana el cliente por cada unidad comprada, acreditados cuando el pago se marca como Pagado"
          />
        </div>
      </div>

      <!-- Precios por mayor -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Precios por mayor</h3>
        <ProductPriceTierList
          :product-id="id"
          :currency-symbol="currencySymbol"
          @update:staged="stagedPriceTiers = $event"
        />
      </div>

      <!-- Atributos físicos -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Atributos físicos</h3>
        <div class="space-y-4">
          <div>
            <p class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Color</p>
            <ColorPicker v-model="color" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model.number="weight" label="Peso (kg)" type="number" step="0.001" placeholder="0.000" />
            <BaseSelect v-model="unit" label="Tipo de medida" :options="unitOptions" required />
          </div>
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
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Características</h3>
        <ProductFeatureList
          :product-id="id"
          :category-path="selectedCategoryPath"
          @update:staged="stagedFeatures = $event"
        />
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
