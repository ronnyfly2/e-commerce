<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { PlusIcon, EyeIcon } from '@heroicons/vue/24/outline';
import { useOrderStore } from '../stores/order.store';
import { orderApi } from '../api';
import {
  ORDER_STATUS_LABELS,
  ORDER_CHANNEL_LABELS,
  type OrderStatus,
  type OrderChannel,
  type OrderFilters,
  formatCents,
} from '../types';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import SearchInput from '@/shared/components/common/SearchInput.vue';
import BasePaginator from '@/shared/components/data/BasePaginator.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import EmptyState from '@/shared/components/feedback/EmptyState.vue';
import ErrorAlert from '@/shared/components/feedback/ErrorAlert.vue';
import BaseModal from '@/shared/components/ui/BaseModal.vue';
import OrderStatusBadge from '../components/OrderStatusBadge.vue';
import OrderPaymentBadge from '../components/OrderPaymentBadge.vue';

const store = useOrderStore();
const router = useRouter();

const search = ref('');
const page = ref(1);
const statusFilter = ref<OrderStatus | ''>('');
const channelFilter = ref<OrderChannel | ''>('');
const dateFrom = ref('');
const dateTo = ref('');
const cancelTarget = ref<string | null>(null);
const isCancelling = ref(false);

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];
const channelOptions = [
  { value: '', label: 'Todos los canales' },
  ...Object.entries(ORDER_CHANNEL_LABELS).map(([value, label]) => ({ value, label })),
];

onMounted(load);

function buildFilters(): OrderFilters {
  return {
    page: page.value,
    search: search.value || undefined,
    status: (statusFilter.value as OrderStatus) || undefined,
    channel: (channelFilter.value as OrderChannel) || undefined,
    dateFrom: dateFrom.value || undefined,
    dateTo: dateTo.value || undefined,
  };
}

async function load() {
  await store.fetchAll(buildFilters());
}

function onSearch(v: string) { search.value = v; page.value = 1; load(); }
function onPageChange(p: number) { page.value = p; load(); }
function onFilterChange() { page.value = 1; load(); }

async function confirmCancel() {
  if (!cancelTarget.value) return;
  isCancelling.value = true;
  try {
    await orderApi.cancel(cancelTarget.value);
    toast.success('Pedido cancelado');
    cancelTarget.value = null;
    load();
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isCancelling.value = false;
  }
}

function channelIcon(channel: OrderChannel) {
  const icons: Record<OrderChannel, string> = {
    ONLINE: '🌐',
    ADMIN: '🖥️',
    PHONE: '📞',
    WHATSAPP: '💬',
  };
  return icons[channel];
}
</script>

<template>
  <div>
    <PageHeader title="Pedidos" description="Gestiona y da seguimiento a todos los pedidos">
      <BaseButton @click="router.push('/orders/new')">
        <PlusIcon class="h-4 w-4" /> Nuevo pedido
      </BaseButton>
    </PageHeader>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap gap-3">
      <div class="w-64">
        <SearchInput :model-value="search" @update:model-value="onSearch" placeholder="Buscar pedido, cliente..." />
      </div>
      <BaseSelect
        v-model="statusFilter"
        :options="statusOptions"
        class="w-44"
        @update:model-value="onFilterChange"
      />
      <BaseSelect
        v-model="channelFilter"
        :options="channelOptions"
        class="w-44"
        @update:model-value="onFilterChange"
      />
      <input
        v-model="dateFrom"
        type="date"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        @change="onFilterChange"
      />
      <input
        v-model="dateTo"
        type="date"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        @change="onFilterChange"
      />
    </div>

    <ErrorAlert v-if="store.error" :message="store.error" @retry="load" />

    <div v-if="!store.error" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div v-if="store.isLoading" class="flex h-48 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
      <template v-else>
        <EmptyState v-if="store.list.length === 0">
          <BaseButton @click="router.push('/orders/new')">
            <PlusIcon class="h-4 w-4" /> Crear primer pedido
          </BaseButton>
        </EmptyState>

        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pedido</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Canal</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pago</th>
              <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</th>
              <th class="px-6 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="order in store.list"
              :key="order.id"
              class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="router.push(`/orders/${order.id}`)"
            >
              <td class="whitespace-nowrap px-6 py-4">
                <span class="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {{ order.orderNumber }}
                </span>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                {{ channelIcon(order.channel) }} {{ ORDER_CHANNEL_LABELS[order.channel] }}
              </td>
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ order.customerName }}</p>
                <p v-if="order.customerPhone" class="text-xs text-gray-500">{{ order.customerPhone }}</p>
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <OrderStatusBadge :status="order.status" />
              </td>
              <td class="whitespace-nowrap px-6 py-4">
                <OrderPaymentBadge :status="order.paymentStatus" />
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right">
                <span class="text-sm font-semibold text-gray-900 dark:text-white">
                  {{ formatCents(order.totalCents, order.currencyCode) }}
                </span>
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {{ new Date(order.createdAt).toLocaleDateString('es-PE') }}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right" @click.stop>
                <button
                  type="button"
                  class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                  @click="router.push(`/orders/${order.id}`)"
                >
                  <EyeIcon class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="store.meta" class="border-t border-gray-200 px-6 dark:border-gray-700">
          <BasePaginator :meta="store.meta" @change="onPageChange" />
        </div>
      </template>
    </div>

    <BaseModal :open="!!cancelTarget" title="Cancelar pedido" @close="cancelTarget = null">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Cancelar este pedido? El estado cambiará a <strong>Cancelado</strong>.
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="cancelTarget = null">Volver</BaseButton>
        <BaseButton variant="danger" :loading="isCancelling" @click="confirmCancel">Cancelar pedido</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
