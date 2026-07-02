<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from '@/shared/composables/useToast';
import { ArrowLeftIcon, TruckIcon, UserIcon, CurrencyDollarIcon } from '@heroicons/vue/24/outline';
import { useOrderStore } from '../stores/order.store';
import { orderApi } from '../api';
import {
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUS_LABELS,
  ORDER_CHANNEL_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
  formatCents,
} from '../types';
import { extractApiError } from '@/shared/types/api.types';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseModal from '@/shared/components/ui/BaseModal.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import OrderStatusBadge from '../components/OrderStatusBadge.vue';
import OrderPaymentBadge from '../components/OrderPaymentBadge.vue';
import OrderStatusTimeline from '../components/OrderStatusTimeline.vue';

const route = useRoute();
const router = useRouter();
const store = useOrderStore();

const showStatusModal = ref(false);
const showPaymentModal = ref(false);
const isUpdating = ref(false);
const selectedStatus = ref<OrderStatus | ''>('');
const statusNotes = ref('');
const selectedPaymentStatus = ref<PaymentStatus | ''>('');

onMounted(() => store.fetchById(route.params.id as string));

const order = computed(() => store.current);

const nextStatusOptions = computed(() => {
  if (!order.value) return [];
  return ORDER_STATUS_TRANSITIONS[order.value.status].map((s) => ({
    value: s,
    label: ORDER_STATUS_LABELS[s],
  }));
});

const paymentStatusOptions: { value: PaymentStatus; label: string }[] = [
  { value: 'UNPAID', label: PAYMENT_STATUS_LABELS.UNPAID },
  { value: 'PARTIAL', label: PAYMENT_STATUS_LABELS.PARTIAL },
  { value: 'PAID', label: PAYMENT_STATUS_LABELS.PAID },
  { value: 'REFUNDED', label: PAYMENT_STATUS_LABELS.REFUNDED },
];

async function submitStatusChange() {
  if (!order.value || !selectedStatus.value) return;
  isUpdating.value = true;
  try {
    const updated = await orderApi.updateStatus(order.value.id, {
      status: selectedStatus.value,
      notes: statusNotes.value || undefined,
    });
    store.setCurrent(updated);
    toast.success(`Estado actualizado a: ${ORDER_STATUS_LABELS[selectedStatus.value]}`);
    showStatusModal.value = false;
    statusNotes.value = '';
    selectedStatus.value = '';
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isUpdating.value = false;
  }
}

async function submitPaymentChange() {
  if (!order.value || !selectedPaymentStatus.value) return;
  isUpdating.value = true;
  try {
    const updated = await orderApi.updatePaymentStatus(order.value.id, {
      paymentStatus: selectedPaymentStatus.value,
    });
    store.setCurrent(updated);
    toast.success('Estado de pago actualizado');
    showPaymentModal.value = false;
    selectedPaymentStatus.value = '';
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isUpdating.value = false;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center gap-3">
      <button
        type="button"
        class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        @click="router.back()"
      >
        <ArrowLeftIcon class="h-5 w-5" />
      </button>
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          Pedido
          <span v-if="order" class="font-mono text-primary-600 dark:text-primary-400">
            {{ order.orderNumber }}
          </span>
        </h1>
        <p v-if="order" class="text-sm text-gray-500">
          {{ ORDER_CHANNEL_LABELS[order.channel] }} ·
          {{ formatDate(order.createdAt) }}
          <template v-if="order.store"> · {{ order.store.name }}</template>
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex h-64 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>

    <template v-else-if="order">
      <!-- Status bar -->
      <div class="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">Estado:</span>
          <OrderStatusBadge :status="order.status" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">Pago:</span>
          <OrderPaymentBadge :status="order.paymentStatus" />
        </div>
        <div class="ml-auto flex gap-2">
          <BaseButton
            v-if="nextStatusOptions.length"
            variant="secondary"
            @click="showStatusModal = true"
          >
            Cambiar estado
          </BaseButton>
          <BaseButton variant="secondary" @click="showPaymentModal = true">
            <CurrencyDollarIcon class="h-4 w-4" /> Pago
          </BaseButton>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Left col: items + totals -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Items -->
          <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 class="font-semibold text-gray-900 dark:text-white">Productos</h2>
            </div>
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Producto</th>
                  <th class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Qty</th>
                  <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Precio unit.</th>
                  <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="item in order.items" :key="item.id">
                  <td class="px-6 py-4">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.productName }}</p>
                    <p v-if="item.productSku" class="text-xs font-mono text-gray-500">{{ item.productSku }}</p>
                    <p v-if="item.notes" class="text-xs italic text-gray-400">{{ item.notes }}</p>
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
                    {{ item.quantity }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700 dark:text-gray-300">
                    {{ formatCents(item.unitPriceCents, order.currencyCode) }}
                  </td>
                  <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    {{ formatCents(item.totalPriceCents, order.currencyCode) }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Totals -->
            <div class="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between text-gray-600 dark:text-gray-400">
                  <dt>Subtotal</dt>
                  <dd>{{ formatCents(order.subtotalCents, order.currencyCode) }}</dd>
                </div>
                <div v-if="order.discountCents" class="flex justify-between text-green-600">
                  <dt>Descuento</dt>
                  <dd>− {{ formatCents(order.discountCents, order.currencyCode) }}</dd>
                </div>
                <div v-if="order.taxCents" class="flex justify-between text-gray-600 dark:text-gray-400">
                  <dt>Impuestos</dt>
                  <dd>{{ formatCents(order.taxCents, order.currencyCode) }}</dd>
                </div>
                <div v-if="order.shippingCents" class="flex justify-between text-gray-600 dark:text-gray-400">
                  <dt>Envío</dt>
                  <dd>{{ formatCents(order.shippingCents, order.currencyCode) }}</dd>
                </div>
                <div class="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                  <dt>Total</dt>
                  <dd>{{ formatCents(order.totalCents, order.currencyCode) }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Timeline -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 class="mb-4 font-semibold text-gray-900 dark:text-white">Historial de estados</h2>
            <OrderStatusTimeline :history="order.statusHistory" />
          </div>
        </div>

        <!-- Right col: customer + delivery + notes -->
        <div class="space-y-6">
          <!-- Customer -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div class="mb-4 flex items-center gap-2">
              <UserIcon class="h-5 w-5 text-gray-400" />
              <h2 class="font-semibold text-gray-900 dark:text-white">Cliente</h2>
            </div>
            <dl class="space-y-2 text-sm">
              <div>
                <dt class="text-gray-500">Nombre</dt>
                <dd class="font-medium text-gray-900 dark:text-white">{{ order.customerName }}</dd>
              </div>
              <div v-if="order.customerEmail">
                <dt class="text-gray-500">Email</dt>
                <dd class="text-gray-700 dark:text-gray-300">{{ order.customerEmail }}</dd>
              </div>
              <div v-if="order.customerPhone">
                <dt class="text-gray-500">Teléfono</dt>
                <dd class="text-gray-700 dark:text-gray-300">{{ order.customerPhone }}</dd>
              </div>
              <div v-if="order.customerNotes">
                <dt class="text-gray-500">Nota del cliente</dt>
                <dd class="italic text-gray-600 dark:text-gray-400">"{{ order.customerNotes }}"</dd>
              </div>
            </dl>
          </div>

          <!-- Delivery -->
          <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div class="mb-4 flex items-center gap-2">
              <TruckIcon class="h-5 w-5 text-gray-400" />
              <h2 class="font-semibold text-gray-900 dark:text-white">Entrega</h2>
            </div>
            <dl class="space-y-2 text-sm">
              <div>
                <dt class="text-gray-500">Tipo</dt>
                <dd class="font-medium text-gray-900 dark:text-white">
                  {{ order.deliveryType === 'DELIVERY' ? 'Envío a domicilio' : 'Recojo en tienda' }}
                </dd>
              </div>
              <template v-if="order.deliveryType === 'DELIVERY'">
                <div v-if="order.deliveryAddress">
                  <dt class="text-gray-500">Dirección</dt>
                  <dd class="text-gray-700 dark:text-gray-300">{{ order.deliveryAddress }}</dd>
                </div>
                <div v-if="order.deliveryCity || order.deliveryState">
                  <dt class="text-gray-500">Ciudad / Región</dt>
                  <dd class="text-gray-700 dark:text-gray-300">
                    {{ [order.deliveryCity, order.deliveryState].filter(Boolean).join(', ') }}
                  </dd>
                </div>
                <div v-if="order.deliveryReference">
                  <dt class="text-gray-500">Referencia</dt>
                  <dd class="text-gray-700 dark:text-gray-300">{{ order.deliveryReference }}</dd>
                </div>
              </template>
              <div v-if="order.shippedAt">
                <dt class="text-gray-500">Fecha de envío</dt>
                <dd class="text-gray-700 dark:text-gray-300">{{ formatDate(order.shippedAt) }}</dd>
              </div>
              <div v-if="order.deliveredAt">
                <dt class="text-gray-500">Fecha de entrega</dt>
                <dd class="text-gray-700 dark:text-gray-300">{{ formatDate(order.deliveredAt) }}</dd>
              </div>
            </dl>
          </div>

          <!-- Notes -->
          <div v-if="order.notes" class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 class="mb-2 font-semibold text-gray-900 dark:text-white">Notas internas</h2>
            <p class="text-sm italic text-gray-600 dark:text-gray-400">{{ order.notes }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Status change modal -->
    <BaseModal :open="showStatusModal" title="Cambiar estado del pedido" @close="showStatusModal = false">
      <div class="space-y-4">
        <BaseSelect
          v-model="selectedStatus"
          :options="[{ value: '', label: 'Selecciona nuevo estado' }, ...nextStatusOptions]"
          label="Nuevo estado"
        />
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nota (opcional)
          </label>
          <textarea
            v-model="statusNotes"
            rows="3"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            placeholder="Razón o comentario del cambio..."
          />
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showStatusModal = false">Cancelar</BaseButton>
        <BaseButton :loading="isUpdating" :disabled="!selectedStatus" @click="submitStatusChange">
          Actualizar estado
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Payment status modal -->
    <BaseModal :open="showPaymentModal" title="Estado de pago" @close="showPaymentModal = false">
      <BaseSelect
        v-model="selectedPaymentStatus"
        :options="[{ value: '', label: 'Selecciona estado' }, ...paymentStatusOptions]"
        label="Estado de pago"
      />
      <template #footer>
        <BaseButton variant="secondary" @click="showPaymentModal = false">Cancelar</BaseButton>
        <BaseButton :loading="isUpdating" :disabled="!selectedPaymentStatus" @click="submitPaymentChange">
          Actualizar
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
