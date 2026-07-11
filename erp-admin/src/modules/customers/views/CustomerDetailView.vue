<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { PencilIcon, SparklesIcon } from '@heroicons/vue/24/outline';
import { toast } from '@/shared/composables/useToast';
import { customerApi } from '../api';
import { CUSTOMER_SOURCE_LABELS, POINTS_TRANSACTION_TYPE_LABELS } from '../types';
import type { Customer, PointsTransaction } from '../types';
import { dealApi } from '@/modules/deals/api';
import { DEAL_STAGE_LABELS } from '@/modules/deals/types';
import type { Deal } from '@/modules/deals/types';
import { orderApi } from '@/modules/orders/api';
import { ORDER_STATUS_LABELS, formatCents } from '@/modules/orders/types';
import type { Order } from '@/modules/orders/types';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseBadge from '@/shared/components/ui/BaseBadge.vue';
import BaseModal from '@/shared/components/ui/BaseModal.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import WhatsAppConversation from '@/modules/whatsapp/components/WhatsAppConversation.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const customer = ref<Customer | null>(null);
const deals = ref<Deal[]>([]);
const orders = ref<Order[]>([]);
const pointsBalance = ref(0);
const pointsTransactions = ref<PointsTransaction[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const showAdjustModal = ref(false);

onMounted(load);

async function load() {
  isLoading.value = true;
  error.value = null;
  try {
    customer.value = await customerApi.getById(id);
    const [allDeals, ordersRes, points] = await Promise.all([
      dealApi.getAll(),
      orderApi.getAll({ customerId: id }),
      customerApi.getPoints(id),
    ]);
    deals.value = allDeals.filter((d) => d.customerId === id);
    orders.value = ordersRes.items;
    pointsBalance.value = points.balance;
    pointsTransactions.value = points.transactions.items;
  } catch (e) {
    error.value = extractApiError(e);
  } finally {
    isLoading.value = false;
  }
}

const adjustSchema = toTypedSchema(z.object({
  points: z.coerce.number().int().refine((v) => v !== 0, 'Ingresa un valor distinto de cero'),
  reason: z.string().min(1, 'Indica el motivo del ajuste').max(255),
}));
const { handleSubmit: handleAdjustSubmit, isSubmitting: isAdjusting, resetForm: resetAdjustForm } = useForm({ validationSchema: adjustSchema });
const { value: adjustPoints, errorMessage: adjustPointsError } = useField<number>('points');
const { value: adjustReason, errorMessage: adjustReasonError } = useField<string>('reason');

const submitAdjust = handleAdjustSubmit(async (values) => {
  try {
    await customerApi.adjustPoints(id, values);
    toast.success('Puntos ajustados');
    showAdjustModal.value = false;
    resetAdjustForm();
    await load();
  } catch (e) {
    toast.error(extractApiError(e));
  }
});

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div v-if="isLoading" class="flex h-48 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
    <div v-else-if="error" class="py-6 text-center text-sm text-red-500">{{ error }}</div>
    <template v-else-if="customer">
      <PageHeader :title="customer.name" :description="customer.phone">
        <BaseButton variant="secondary" @click="router.push(`/customers/${id}/edit`)">
          <PencilIcon class="h-4 w-4" /> Editar
        </BaseButton>
      </PageHeader>

      <div class="space-y-6">
        <!-- Info -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Información</h3>
          <dl class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-gray-500">Email</dt>
              <dd class="text-gray-900 dark:text-white">{{ customer.email ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Origen</dt>
              <dd><BaseBadge :variant="customer.source === 'whatsapp' ? 'success' : 'default'">{{ CUSTOMER_SOURCE_LABELS[customer.source] }}</BaseBadge></dd>
            </div>
            <div class="col-span-2">
              <dt class="text-gray-500">Notas</dt>
              <dd class="text-gray-900 dark:text-white">{{ customer.notes ?? '—' }}</dd>
            </div>
          </dl>
        </div>

        <!-- Puntos -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Puntos de fidelidad</h3>
            <BaseButton size="sm" variant="secondary" @click="showAdjustModal = true">
              <SparklesIcon class="h-4 w-4" /> Ajustar puntos
            </BaseButton>
          </div>
          <p class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">{{ pointsBalance }} pts</p>
          <p v-if="pointsTransactions.length === 0" class="text-xs text-gray-400">Sin movimientos de puntos</p>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <li v-for="tx in pointsTransactions" :key="tx.id" class="flex items-center justify-between py-2 text-sm">
              <div>
                <p class="text-gray-900 dark:text-white">{{ tx.reason ?? POINTS_TRANSACTION_TYPE_LABELS[tx.type] }}</p>
                <p class="text-xs text-gray-500">{{ POINTS_TRANSACTION_TYPE_LABELS[tx.type] }} · {{ formatDate(tx.createdAt) }}</p>
              </div>
              <span :class="tx.points >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-semibold">
                {{ tx.points >= 0 ? '+' : '' }}{{ tx.points }}
              </span>
            </li>
          </ul>
        </div>

        <!-- WhatsApp -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">WhatsApp</h3>
          <WhatsAppConversation :customer-id="id" />
        </div>

        <!-- Deals -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Oportunidades</h3>
            <RouterLink :to="`/deals/new?customerId=${id}`" class="text-xs text-primary-600 hover:underline dark:text-primary-400">+ Nueva oportunidad</RouterLink>
          </div>
          <p v-if="deals.length === 0" class="text-xs text-gray-400">Sin oportunidades registradas</p>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <li v-for="d in deals" :key="d.id" class="flex items-center justify-between py-2 text-sm">
              <span class="text-gray-900 dark:text-white">{{ d.title }}</span>
              <BaseBadge>{{ DEAL_STAGE_LABELS[d.stage] }}</BaseBadge>
            </li>
          </ul>
        </div>

        <!-- Orders -->
        <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Pedidos</h3>
          <p v-if="orders.length === 0" class="text-xs text-gray-400">Sin pedidos vinculados a este cliente</p>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <li v-for="o in orders" :key="o.id" class="flex items-center justify-between py-2 text-sm">
              <RouterLink :to="`/orders/${o.id}`" class="font-mono text-primary-600 hover:underline dark:text-primary-400">{{ o.orderNumber }}</RouterLink>
              <span class="text-gray-500">{{ ORDER_STATUS_LABELS[o.status] }} · {{ formatCents(o.totalCents, o.currencyCode) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <BaseModal :open="showAdjustModal" title="Ajustar puntos" @close="showAdjustModal = false">
      <form class="space-y-4" @submit.prevent="submitAdjust">
        <BaseInput
          v-model.number="adjustPoints"
          label="Puntos"
          type="number"
          placeholder="100 o -50"
          :error="adjustPointsError"
          hint="Usa un valor negativo para descontar puntos"
          required
        />
        <BaseInput v-model="adjustReason" label="Motivo" placeholder="Compensación por reseña" :error="adjustReasonError" required />
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="showAdjustModal = false">Cancelar</BaseButton>
        <BaseButton :loading="isAdjusting" @click="submitAdjust">Guardar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
