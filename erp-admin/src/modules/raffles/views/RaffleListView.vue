<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { PlusIcon, GiftIcon } from '@heroicons/vue/24/outline';
import { raffleApi } from '../api';
import { RAFFLE_STATUS_LABELS, type Raffle, type RaffleStatus } from '../types';
import { extractApiError } from '@/shared/types/api.types';
import type { PaginationMeta } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BasePaginator from '@/shared/components/data/BasePaginator.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseBadge from '@/shared/components/ui/BaseBadge.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import EmptyState from '@/shared/components/feedback/EmptyState.vue';
import ErrorAlert from '@/shared/components/feedback/ErrorAlert.vue';

const router = useRouter();
const list = ref<Raffle[]>([]);
const meta = ref<PaginationMeta | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const page = ref(1);
const statusFilter = ref<RaffleStatus | ''>('');

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(RAFFLE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const badgeVariant: Record<RaffleStatus, 'default' | 'info' | 'success'> = {
  DRAFT: 'default',
  OPEN: 'info',
  CLOSED: 'success',
};

onMounted(load);

async function load() {
  isLoading.value = true;
  error.value = null;
  try {
    const res = await raffleApi.getAll({
      page: page.value,
      status: (statusFilter.value as RaffleStatus) || undefined,
    });
    list.value = res.items;
    meta.value = res.meta;
  } catch (e) {
    error.value = extractApiError(e);
  } finally {
    isLoading.value = false;
  }
}

function onFilterChange() { page.value = 1; load(); }
function onPageChange(p: number) { page.value = p; load(); }

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(iso));
}
</script>

<template>
  <div>
    <PageHeader title="Sorteos" description="Sortea premios entre clientes activos con compras o puntos">
      <BaseButton @click="router.push('/raffles/new')">
        <PlusIcon class="h-4 w-4" /> Nuevo sorteo
      </BaseButton>
    </PageHeader>

    <div class="mb-4 w-52">
      <BaseSelect v-model="statusFilter" :options="statusOptions" @update:model-value="onFilterChange" />
    </div>

    <ErrorAlert v-if="error" :message="error" @retry="load" />

    <div v-if="!error" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div v-if="isLoading" class="flex h-48 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
      <template v-else>
        <EmptyState v-if="list.length === 0" title="Sin sorteos" description="Crea tu primer sorteo para premiar a tus clientes.">
          <BaseButton @click="router.push('/raffles/new')">
            <PlusIcon class="h-4 w-4" /> Crear primer sorteo
          </BaseButton>
        </EmptyState>

        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Premio</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Periodo</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
              <th class="px-6 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="raffle in list"
              :key="raffle.id"
              class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="router.push(`/raffles/${raffle.id}`)"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <GiftIcon class="h-4 w-4 text-gray-400" />
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ raffle.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{{ raffle.prizeDescription }}</td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ formatDate(raffle.startsAt) }} – {{ formatDate(raffle.endsAt) }}
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <BaseBadge :variant="badgeVariant[raffle.status]">{{ RAFFLE_STATUS_LABELS[raffle.status] }}</BaseBadge>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right text-xs text-primary-600 dark:text-primary-400">
                Ver detalle →
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="meta" class="border-t border-gray-200 px-6 dark:border-gray-700">
          <BasePaginator :meta="meta" @change="onPageChange" />
        </div>
      </template>
    </div>
  </div>
</template>
