<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from '@/shared/composables/useToast';
import { PlusIcon } from '@heroicons/vue/24/outline';
import { dealApi } from '../api';
import { DEAL_STAGES, DEAL_STAGE_LABELS } from '../types';
import type { Deal, DealStage } from '../types';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import ErrorAlert from '@/shared/components/feedback/ErrorAlert.vue';

const router = useRouter();
const deals = ref<Deal[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const movingId = ref<string | null>(null);

const stageOptions = DEAL_STAGES.map((s) => ({ label: DEAL_STAGE_LABELS[s], value: s }));

onMounted(load);

async function load() {
  isLoading.value = true; error.value = null;
  try {
    deals.value = await dealApi.getAll();
  } catch (e) { error.value = extractApiError(e); }
  finally { isLoading.value = false; }
}

function dealsByStage(stage: DealStage) {
  return deals.value.filter((d) => d.stage === stage);
}

const stageTotals = computed(() => {
  const totals: Record<DealStage, number> = { new: 0, contacted: 0, negotiating: 0, won: 0, lost: 0 };
  for (const d of deals.value) totals[d.stage] += d.value ?? 0;
  return totals;
});

async function moveStage(deal: Deal, stage: DealStage) {
  if (stage === deal.stage) return;
  movingId.value = deal.id;
  try {
    const updated = await dealApi.updateStage(deal.id, stage);
    deals.value = deals.value.map((d) => (d.id === updated.id ? updated : d));
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    movingId.value = null;
  }
}
</script>

<template>
  <div>
    <PageHeader title="Pipeline de ventas" description="Oportunidades por etapa">
      <BaseButton @click="router.push('/deals/new')"><PlusIcon class="h-4 w-4" /> Nueva oportunidad</BaseButton>
    </PageHeader>

    <ErrorAlert v-if="error" :message="error" @retry="load" />

    <div v-if="isLoading" class="flex h-48 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>

    <div v-else-if="!error" class="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <div v-for="stage in DEAL_STAGES" :key="stage" class="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{{ DEAL_STAGE_LABELS[stage] }}</h3>
          <span class="text-xs text-gray-400">{{ dealsByStage(stage).length }}</span>
        </div>
        <p class="mb-3 text-xs text-gray-400">{{ stageTotals[stage].toFixed(2) }}</p>

        <div class="space-y-2">
          <div
            v-for="deal in dealsByStage(stage)"
            :key="deal.id"
            class="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <p class="font-medium text-gray-900 dark:text-white">{{ deal.title }}</p>
            <RouterLink :to="`/customers/${deal.customerId}`" class="text-xs text-primary-600 hover:underline dark:text-primary-400">
              {{ deal.customer?.name ?? 'Cliente' }}
            </RouterLink>
            <p v-if="deal.value" class="mt-1 text-xs text-gray-500">{{ deal.currencyCode }} {{ deal.value.toFixed(2) }}</p>
            <BaseSelect
              class="mt-2"
              :model-value="deal.stage"
              :options="stageOptions"
              :disabled="movingId === deal.id"
              @update:model-value="moveStage(deal, $event as DealStage)"
            />
          </div>
          <p v-if="dealsByStage(stage).length === 0" class="text-center text-xs text-gray-400">Sin oportunidades</p>
        </div>
      </div>
    </div>
  </div>
</template>
