<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { userApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import type { User } from '../types';
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
const list = ref<User[]>([]);
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
    const res = await userApi.getAll({ page: page.value, search: search.value });
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
    await userApi.remove(deleteTarget.value);
    toast.success('Usuario eliminado');
    deleteTarget.value = null; load();
  } catch (e) { toast.error(extractApiError(e)); }
  finally { isDeleting.value = false; }
}
</script>

<template>
  <div>
    <PageHeader title="Personal" description="Gestiona el personal y sus accesos">
      <BaseButton @click="router.push('/users/new')"><PlusIcon class="h-4 w-4" /> Nuevo usuario</BaseButton>
    </PageHeader>
    <div class="mb-4 max-w-xs"><SearchInput :model-value="search" @update:model-value="onSearch" /></div>
    <ErrorAlert v-if="error" :message="error" @retry="load" />
    <div v-if="!error" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div v-if="isLoading" class="flex h-48 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
      <template v-else>
        <EmptyState v-if="list.length === 0">
          <BaseButton @click="router.push('/users/new')"><PlusIcon class="h-4 w-4" /> Crear primer usuario</BaseButton>
        </EmptyState>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rol</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
              <th class="px-6 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="u in list" :key="u.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="whitespace-nowrap px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-semibold dark:bg-primary-900/30 dark:text-primary-400">
                    {{ u.firstName[0] }}{{ u.lastName[0] }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ u.firstName }} {{ u.lastName }}</p>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ u.email }}</td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                <BaseBadge v-if="u.isSuperAdmin" variant="warning">Super Admin</BaseBadge>
                <span v-else>{{ u.role?.name ?? '—' }}</span>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <BaseBadge :variant="u.isActive ? 'success' : 'danger'">{{ u.isActive ? 'Activo' : 'Inactivo' }}</BaseBadge>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button type="button" class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700" @click="router.push(`/users/${u.id}/edit`)"><PencilIcon class="h-4 w-4" /></button>
                  <button type="button" class="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" @click="deleteTarget = u.id"><TrashIcon class="h-4 w-4" /></button>
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
    <BaseModal :open="!!deleteTarget" title="Eliminar usuario" @close="deleteTarget = null">
      <p class="text-sm text-gray-600 dark:text-gray-400">¿Eliminar este usuario?</p>
      <template #footer>
        <BaseButton variant="secondary" @click="deleteTarget = null">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeleting" @click="confirmDelete">Eliminar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
