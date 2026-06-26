<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon } from '@heroicons/vue/24/outline';
import { productApi } from '../api';
import { categoryApi } from '@/modules/categories/api';
import { brandApi } from '@/modules/brands/api';
import { extractApiError } from '@/shared/types/api.types';
import type { Product } from '../types';
import type { PaginationMeta } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import SearchInput from '@/shared/components/common/SearchInput.vue';
import BasePaginator from '@/shared/components/data/BasePaginator.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import BaseBadge from '@/shared/components/ui/BaseBadge.vue';
import EmptyState from '@/shared/components/feedback/EmptyState.vue';
import ErrorAlert from '@/shared/components/feedback/ErrorAlert.vue';
import BaseModal from '@/shared/components/ui/BaseModal.vue';

const router = useRouter();
const list = ref<Product[]>([]);
const meta = ref<PaginationMeta | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const search = ref('');
const page = ref(1);
const filterCategoryId = ref('');
const filterBrandId = ref('');
const filterIsActive = ref('');
const deleteTarget = ref<string | null>(null);
const isDeleting = ref(false);

const categoryOptions = ref<{ label: string; value: string }[]>([{ label: 'Todas las categorías', value: '' }]);
const brandOptions = ref<{ label: string; value: string }[]>([{ label: 'Todas las marcas', value: '' }]);
const activeOptions = [{ label: 'Todos', value: '' }, { label: 'Activos', value: 'true' }, { label: 'Inactivos', value: 'false' }];

onMounted(async () => {
  const [cats, brands] = await Promise.all([categoryApi.getAll({ limit: 200 }), brandApi.getAll({ limit: 200 })]);
  categoryOptions.value.push(...cats.items.map((c) => ({ label: c.name, value: c.id })));
  brandOptions.value.push(...brands.items.map((b) => ({ label: b.name, value: b.id })));
  load();
});

async function load() {
  isLoading.value = true; error.value = null;
  try {
    const res = await productApi.getAll({
      page: page.value,
      search: search.value,
      categoryId: filterCategoryId.value || undefined,
      brandId: filterBrandId.value || undefined,
      isActive: filterIsActive.value !== '' ? filterIsActive.value === 'true' : undefined,
    });
    list.value = res.items; meta.value = res.meta;
  } catch (e) { error.value = extractApiError(e); }
  finally { isLoading.value = false; }
}

function onSearch(v: string) { search.value = v; page.value = 1; load(); }
function onFilter() { page.value = 1; load(); }
function onPageChange(p: number) { page.value = p; load(); }

async function confirmDelete() {
  if (!deleteTarget.value) return;
  isDeleting.value = true;
  try {
    await productApi.remove(deleteTarget.value);
    toast.success('Producto eliminado');
    deleteTarget.value = null; load();
  } catch (e) { toast.error(extractApiError(e)); }
  finally { isDeleting.value = false; }
}

function formatPrice(price: string) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(price));
}
</script>

<template>
  <div>
    <PageHeader title="Productos" description="Gestiona el catálogo de productos">
      <BaseButton @click="router.push('/products/new')"><PlusIcon class="h-4 w-4" /> Nuevo producto</BaseButton>
    </PageHeader>

    <div class="mb-4 flex flex-wrap gap-3">
      <div class="w-64"><SearchInput :model-value="search" @update:model-value="onSearch" /></div>
      <div class="w-52"><BaseSelect v-model="filterCategoryId" label="" placeholder="Categoría" :options="categoryOptions" @update:model-value="onFilter" /></div>
      <div class="w-52"><BaseSelect v-model="filterBrandId" label="" placeholder="Marca" :options="brandOptions" @update:model-value="onFilter" /></div>
      <div class="w-40"><BaseSelect v-model="filterIsActive" label="" placeholder="Estado" :options="activeOptions" @update:model-value="onFilter" /></div>
    </div>

    <ErrorAlert v-if="error" :message="error" @retry="load" />
    <div v-if="!error" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div v-if="isLoading" class="flex h-48 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
      <template v-else>
        <EmptyState v-if="list.length === 0">
          <BaseButton @click="router.push('/products/new')"><PlusIcon class="h-4 w-4" /> Crear primer producto</BaseButton>
        </EmptyState>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Producto</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SKU</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Precio</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Stock</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
              <th class="px-6 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="p in list" :key="p.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                    <img v-if="p.images?.[0]" :src="p.images[0]" :alt="p.name" class="h-full w-full object-cover" />
                    <PhotoIcon v-else class="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ p.name }}</p>
                    <p class="text-xs text-gray-500">{{ p.category?.name }} · {{ p.brand?.name }}</p>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-500">{{ p.sku }}</td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">{{ formatPrice(p.price) }}</td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ p.stock }}</td>
              <td class="whitespace-nowrap px-6 py-4">
                <BaseBadge :variant="p.isActive ? 'success' : 'danger'">{{ p.isActive ? 'Activo' : 'Inactivo' }}</BaseBadge>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button type="button" class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700" @click="router.push(`/products/${p.id}/edit`)"><PencilIcon class="h-4 w-4" /></button>
                  <button type="button" class="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" @click="deleteTarget = p.id"><TrashIcon class="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="meta" class="border-t border-gray-200 px-6 dark:border-gray-700">
          <BasePaginator :meta="meta" @change="onPageChange" />
        </div>
      </template>
    </div>
    <BaseModal :open="!!deleteTarget" title="Eliminar producto" @close="deleteTarget = null">
      <p class="text-sm text-gray-600 dark:text-gray-400">¿Eliminar este producto?</p>
      <template #footer>
        <BaseButton variant="secondary" @click="deleteTarget = null">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeleting" @click="confirmDelete">Eliminar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
