<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PencilIcon } from '@heroicons/vue/24/outline';
import { userApi } from '../api';
import type { User } from '../types';
import { PERMISSION_GROUPS } from '@/modules/auth/types';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseBadge from '@/shared/components/ui/BaseBadge.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const user = ref<User | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const permissionLabels = new Map(
  PERMISSION_GROUPS.flatMap((g) => g.permissions).map((p) => [p.value, p.label]),
);

onMounted(load);

async function load() {
  isLoading.value = true;
  error.value = null;
  try {
    user.value = await userApi.getById(id);
  } catch (e) {
    error.value = extractApiError(e);
  } finally {
    isLoading.value = false;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div v-if="isLoading" class="flex h-48 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
    <div v-else-if="error" class="py-6 text-center text-sm text-red-500">{{ error }}</div>
    <template v-else-if="user">
      <PageHeader :title="`${user.firstName} ${user.lastName}`" :description="user.email">
        <BaseButton variant="secondary" @click="router.push(`/users/${id}/edit`)">
          <PencilIcon class="h-4 w-4" /> Editar
        </BaseButton>
      </PageHeader>

      <div class="space-y-6">
        <!-- Info -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Información</h3>
          <dl class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-gray-500">Teléfono</dt>
              <dd class="text-gray-900 dark:text-white">{{ user.phone ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Rol</dt>
              <dd>
                <BaseBadge v-if="user.isSuperAdmin" variant="warning">Super Admin</BaseBadge>
                <span v-else class="text-gray-900 dark:text-white">{{ user.role?.name ?? '—' }}</span>
              </dd>
            </div>
            <div>
              <dt class="text-gray-500">Estado</dt>
              <dd><BaseBadge :variant="user.isActive ? 'success' : 'danger'">{{ user.isActive ? 'Activo' : 'Inactivo' }}</BaseBadge></dd>
            </div>
            <div>
              <dt class="text-gray-500">Último acceso</dt>
              <dd class="text-gray-900 dark:text-white">{{ formatDate(user.lastLoginAt) }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Creado</dt>
              <dd class="text-gray-900 dark:text-white">{{ formatDate(user.createdAt) }}</dd>
            </div>
            <div v-if="user.additionalPermissions.length" class="col-span-2">
              <dt class="mb-1 text-gray-500">Permisos adicionales</dt>
              <dd class="flex flex-wrap gap-1.5">
                <BaseBadge v-for="p in user.additionalPermissions" :key="p">{{ permissionLabels.get(p) ?? p }}</BaseBadge>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </template>
  </div>
</template>
