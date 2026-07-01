<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from '@/shared/composables/useToast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { useCompanyStore } from '../stores/company.store';
import { companyApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import SearchInput from '@/shared/components/common/SearchInput.vue';
import BasePaginator from '@/shared/components/data/BasePaginator.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseBadge from '@/shared/components/ui/BaseBadge.vue';
import EmptyState from '@/shared/components/feedback/EmptyState.vue';
import ErrorAlert from '@/shared/components/feedback/ErrorAlert.vue';
import BaseModal from '@/shared/components/ui/BaseModal.vue';

const store = useCompanyStore();
const router = useRouter();

const search = ref('');
const page = ref(1);
const deleteTarget = ref<string | null>(null);
const isDeleting = ref(false);

onMounted(() => load());

async function load() {
  await store.fetchAll({ page: page.value, search: search.value });
}

function onSearch(v: string) {
  search.value = v;
  page.value = 1;
  load();
}

function onPageChange(p: number) {
  page.value = p;
  load();
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  isDeleting.value = true;
  try {
    await companyApi.remove(deleteTarget.value);
    toast.success('Empresa eliminada');
    deleteTarget.value = null;
    load();
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader title="Empresas" description="Gestiona las empresas del sistema">
      <BaseButton @click="router.push('/companies/new')">
        <PlusIcon class="h-4 w-4" />
        Nueva empresa
      </BaseButton>
    </PageHeader>

    <div class="mb-4 max-w-xs">
      <SearchInput :model-value="search" @update:model-value="onSearch" />
    </div>

    <ErrorAlert v-if="store.error" :message="store.error" @retry="load" />

    <!-- Table -->
    <div v-if="!store.error" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div v-if="store.isLoading" class="flex h-48 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>

      <template v-else>
        <EmptyState v-if="store.list.length === 0">
          <BaseButton @click="router.push('/companies/new')">
            <PlusIcon class="h-4 w-4" />
            Crear primera empresa
          </BaseButton>
        </EmptyState>

        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">RUC</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
              <th class="px-6 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="company in store.list"
              :key="company.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td class="whitespace-nowrap px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 font-semibold text-sm dark:bg-primary-900/30 dark:text-primary-400">
                    {{ company.name[0].toUpperCase() }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ company.name }}</p>
                    <p class="text-xs text-gray-500">{{ company.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{{ company.ruc }}</td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ company.email ?? '—' }}</td>
              <td class="whitespace-nowrap px-6 py-4">
                <BaseBadge :variant="company.isActive ? 'success' : 'danger'">
                  {{ company.isActive ? 'Activo' : 'Inactivo' }}
                </BaseBadge>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                    @click="router.push(`/companies/${company.id}/edit`)"
                  >
                    <PencilIcon class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    @click="deleteTarget = company.id"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="store.meta" class="border-t border-gray-200 px-6 dark:border-gray-700">
          <BasePaginator :meta="store.meta" @change="onPageChange" />
        </div>
      </template>
    </div>

    <!-- Delete confirm modal -->
    <BaseModal :open="!!deleteTarget" title="Eliminar empresa" @close="deleteTarget = null">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Estás seguro de que deseas eliminar esta empresa? Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="deleteTarget = null">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeleting" @click="confirmDelete">Eliminar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
