<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from '@/shared/composables/useToast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { brandApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import type { Brand } from '../types';
import type { PaginationMeta } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import SearchInput from '@/shared/components/common/SearchInput.vue';
import BasePaginator from '@/shared/components/data/BasePaginator.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseBadge from '@/shared/components/ui/BaseBadge.vue';
import EmptyState from '@/shared/components/feedback/EmptyState.vue';
import ErrorAlert from '@/shared/components/feedback/ErrorAlert.vue';
import BaseModal from '@/shared/components/ui/BaseModal.vue';

const router = useRouter();
const list = ref<Brand[]>([]);
const meta = ref<PaginationMeta | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const search = ref('');
const page = ref(1);
const deleteTarget = ref<string | null>(null);
const isDeleting = ref(false);

onMounted(() => load());

async function load() {
  isLoading.value = true; error.value = null;
  try {
    const res = await brandApi.getAll({ page: page.value, search: search.value });
    list.value = res.items; meta.value = res.meta;
  } catch (e) { error.value = extractApiError(e); }
  finally { isLoading.value = false; }
}

function onSearch(v: string) { search.value = v; page.value = 1; load(); }
function onPageChange(p: number) { page.value = p; load(); }

async function confirmDelete() {
  if (!deleteTarget.value) return;
  isDeleting.value = true;
  try {
    await brandApi.remove(deleteTarget.value);
    toast.success('Marca eliminada');
    deleteTarget.value = null; load();
  } catch (e) { toast.error(extractApiError(e)); }
  finally { isDeleting.value = false; }
}
</script>

<template>
  <div>
    <PageHeader title="Marcas" description="Gestiona las marcas de productos">
      <BaseButton @click="router.push('/brands/new')"><PlusIcon class="h-4 w-4" /> Nueva marca</BaseButton>
    </PageHeader>
    <div class="mb-4 max-w-xs"><SearchInput :model-value="search" @update:model-value="onSearch" /></div>
    <ErrorAlert v-if="error" :message="error" @retry="load" />
    <div v-if="!error" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div v-if="isLoading" class="flex h-48 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
      <template v-else>
        <EmptyState v-if="list.length === 0">
          <BaseButton @click="router.push('/brands/new')"><PlusIcon class="h-4 w-4" /> Crear primera marca</BaseButton>
        </EmptyState>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Slug</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
              <th class="px-6 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="b in list" :key="b.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{{ b.name }}</td>
              <td class="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-500">{{ b.slug }}</td>
              <td class="whitespace-nowrap px-6 py-4">
                <BaseBadge :variant="b.isActive ? 'success' : 'danger'">{{ b.isActive ? 'Activa' : 'Inactiva' }}</BaseBadge>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button type="button" class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700" @click="router.push(`/brands/${b.id}/edit`)"><PencilIcon class="h-4 w-4" /></button>
                  <button type="button" class="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" @click="deleteTarget = b.id"><TrashIcon class="h-4 w-4" /></button>
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
    <BaseModal :open="!!deleteTarget" title="Eliminar marca" @close="deleteTarget = null">
      <p class="text-sm text-gray-600 dark:text-gray-400">¿Eliminar esta marca?</p>
      <template #footer>
        <BaseButton variant="secondary" @click="deleteTarget = null">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeleting" @click="confirmDelete">Eliminar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
