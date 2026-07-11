<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from '@/shared/composables/useToast';
import { ArrowLeftIcon, PencilIcon, TrashIcon, SparklesIcon, GiftIcon } from '@heroicons/vue/24/outline';
import { raffleApi } from '../api';
import {
  RAFFLE_STATUS_LABELS,
  RAFFLE_STATUS_TRANSITIONS,
  PRIZE_STATUS_LABELS,
  type Raffle,
  type RaffleStatus,
  type EligibleCustomer,
} from '../types';
import { extractApiError } from '@/shared/types/api.types';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseBadge from '@/shared/components/ui/BaseBadge.vue';
import BaseModal from '@/shared/components/ui/BaseModal.vue';
import ImageUploader from '@/shared/components/common/ImageUploader.vue';
import RaffleDrawAnimation from '../components/RaffleDrawAnimation.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const raffle = ref<Raffle | null>(null);
const eligible = ref<EligibleCustomer[]>([]);
const eligibleCount = ref(0);
const isLoading = ref(false);
const isUpdatingStatus = ref(false);
const isDeleting = ref(false);
const showDrawModal = ref(false);
const showDeleteModal = ref(false);
const showDrawAnimation = ref(false);
const drawnWinner = ref<{ name: string; phone: string } | null>(null);
const showPrizeModal = ref(false);
const prizeImages = ref<string[]>([]);
const isUpdatingPrize = ref(false);

const badgeVariant: Record<RaffleStatus, 'default' | 'info' | 'success'> = {
  DRAFT: 'default',
  OPEN: 'info',
  CLOSED: 'success',
};

onMounted(load);

async function load() {
  isLoading.value = true;
  try {
    raffle.value = await raffleApi.getById(id);
    if (raffle.value.status !== 'DRAFT') {
      const preview = await raffleApi.getEligible(id);
      eligible.value = preview.customers;
      eligibleCount.value = preview.count;
    }
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isLoading.value = false;
  }
}

const drawAnimationMs = computed(() => (raffle.value?.drawAnimationSeconds ?? 6) * 1000);

const nextStatus = computed<RaffleStatus | null>(() => {
  if (!raffle.value) return null;
  const next = RAFFLE_STATUS_TRANSITIONS[raffle.value.status];
  return next.length > 0 ? next[0] : null;
});

async function openRaffle() {
  if (!raffle.value || !nextStatus.value) return;
  isUpdatingStatus.value = true;
  try {
    raffle.value = await raffleApi.updateStatus(raffle.value.id, nextStatus.value);
    toast.success('Sorteo abierto');
    await load();
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isUpdatingStatus.value = false;
  }
}

async function confirmDraw() {
  if (!raffle.value) return;
  showDrawModal.value = false;
  drawnWinner.value = null;
  showDrawAnimation.value = true;
  try {
    const updated = await raffleApi.draw(raffle.value.id);
    raffle.value = updated;
    drawnWinner.value = updated.winner ? { name: updated.winner.name, phone: updated.winner.phone } : null;
  } catch (e) {
    showDrawAnimation.value = false;
    toast.error(extractApiError(e));
  }
}

function closeDrawAnimation() {
  showDrawAnimation.value = false;
  if (raffle.value?.status === 'CLOSED') toast.success('¡Ganador sorteado!');
}

function openPrizeModal() {
  prizeImages.value = raffle.value?.prizeDeliveryImageUrl ? [raffle.value.prizeDeliveryImageUrl] : [];
  showPrizeModal.value = true;
}

async function confirmPrizeDelivered() {
  if (!raffle.value) return;
  isUpdatingPrize.value = true;
  try {
    raffle.value = await raffleApi.updatePrizeStatus(raffle.value.id, {
      status: 'DELIVERED',
      imageUrl: prizeImages.value[0],
    });
    toast.success('Premio marcado como entregado');
    showPrizeModal.value = false;
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isUpdatingPrize.value = false;
  }
}

async function markPrizePending() {
  if (!raffle.value) return;
  isUpdatingPrize.value = true;
  try {
    raffle.value = await raffleApi.updatePrizeStatus(raffle.value.id, { status: 'PENDING' });
    toast.success('Premio marcado como pendiente');
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isUpdatingPrize.value = false;
  }
}

async function confirmDelete() {
  if (!raffle.value) return;
  isDeleting.value = true;
  try {
    await raffleApi.remove(raffle.value.id);
    toast.success('Sorteo eliminado');
    router.push('/raffles');
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isDeleting.value = false;
  }
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center gap-3">
      <button type="button" class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" @click="router.push('/raffles')">
        <ArrowLeftIcon class="h-5 w-5" />
      </button>
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ raffle?.name }}</h1>
        <p v-if="raffle" class="text-sm text-gray-500">
          {{ formatDate(raffle.startsAt) }} – {{ formatDate(raffle.endsAt) }}
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="flex h-64 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>

    <template v-else-if="raffle">
      <div class="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">Estado:</span>
          <BaseBadge :variant="badgeVariant[raffle.status]">{{ RAFFLE_STATUS_LABELS[raffle.status] }}</BaseBadge>
        </div>
        <div class="ml-auto flex gap-2">
          <BaseButton
            v-if="raffle.status === 'DRAFT'"
            variant="secondary"
            @click="router.push(`/raffles/${raffle.id}/edit`)"
          >
            <PencilIcon class="h-4 w-4" /> Editar
          </BaseButton>
          <BaseButton
            v-if="raffle.status === 'DRAFT'"
            variant="danger"
            @click="showDeleteModal = true"
          >
            <TrashIcon class="h-4 w-4" /> Eliminar
          </BaseButton>
          <BaseButton
            v-if="raffle.status === 'DRAFT'"
            :loading="isUpdatingStatus"
            @click="openRaffle"
          >
            Abrir sorteo
          </BaseButton>
          <BaseButton
            v-if="raffle.status === 'OPEN'"
            :disabled="eligibleCount === 0"
            @click="showDrawModal = true"
          >
            <SparklesIcon class="h-4 w-4" /> Sortear ganador
          </BaseButton>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-6">
          <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 class="mb-4 font-semibold text-gray-900 dark:text-white">Premio</h2>
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ raffle.prizeDescription }}</p>
            <p v-if="raffle.description" class="mt-2 text-sm text-gray-500">{{ raffle.description }}</p>
            <div v-if="raffle.images?.length" class="mt-4 flex flex-wrap gap-3">
              <img
                v-for="url in raffle.images"
                :key="url"
                :src="url"
                alt="Imagen del premio"
                class="h-20 w-20 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
              />
            </div>
            <p class="mt-3 text-xs text-gray-500">
              Costo de entrada:
              <strong>{{ raffle.costPoints > 0 ? `${raffle.costPoints} pts` : 'Gratis' }}</strong>
            </p>
          </div>

          <div v-if="raffle.status !== 'DRAFT'" class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 class="mb-4 font-semibold text-gray-900 dark:text-white">
              Clientes elegibles
              <span class="font-normal text-gray-400">({{ eligibleCount }})</span>
            </h2>
            <p v-if="eligible.length === 0" class="text-xs text-gray-400">
              {{ raffle.costPoints > 0
                ? `Ningún cliente activo tiene los ${raffle.costPoints} puntos requeridos por ahora.`
                : 'Sin clientes activos con compras pagadas o puntos por ahora.' }}
            </p>
            <ul v-else class="max-h-80 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
              <li v-for="c in eligible" :key="c.id" class="flex items-center justify-between py-2 text-sm">
                <div>
                  <p class="text-gray-900 dark:text-white">{{ c.name }}</p>
                  <p class="text-xs text-gray-500">{{ c.phone }}</p>
                </div>
                <span class="text-xs text-gray-500">{{ c.pointsBalance }} pts</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="space-y-6">
          <div v-if="raffle.status === 'CLOSED'" class="rounded-xl border border-primary-200 bg-primary-50 p-6 dark:border-primary-800 dark:bg-primary-900/20">
            <h2 class="mb-2 flex items-center gap-2 font-semibold text-primary-900 dark:text-primary-300">
              <SparklesIcon class="h-5 w-5" /> Ganador
            </h2>
            <p v-if="raffle.winner" class="text-sm font-medium text-gray-900 dark:text-white">{{ raffle.winner.name }}</p>
            <p v-if="raffle.winner" class="text-xs text-gray-500">{{ raffle.winner.phone }}</p>
            <p v-if="raffle.drawnAt" class="mt-2 text-xs text-gray-500">Sorteado el {{ formatDate(raffle.drawnAt) }}</p>

            <div class="mt-4 border-t border-primary-200 pt-4 dark:border-primary-800">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs font-medium text-gray-500">Estado del premio</span>
                <BaseBadge :variant="raffle.prizeStatus === 'DELIVERED' ? 'success' : 'warning'">
                  {{ PRIZE_STATUS_LABELS[raffle.prizeStatus] }}
                </BaseBadge>
              </div>

              <img
                v-if="raffle.prizeDeliveryImageUrl"
                :src="raffle.prizeDeliveryImageUrl"
                alt="Evidencia de entrega del premio"
                class="mb-3 h-32 w-full rounded-lg border border-primary-200 object-cover dark:border-primary-800"
              />
              <p v-if="raffle.prizeDeliveredAt" class="mb-3 text-xs text-gray-500">
                Entregado el {{ formatDate(raffle.prizeDeliveredAt) }}
              </p>

              <BaseButton
                v-if="raffle.prizeStatus === 'PENDING'"
                size="sm"
                class="w-full justify-center"
                :loading="isUpdatingPrize"
                @click="openPrizeModal"
              >
                <GiftIcon class="h-4 w-4" /> Marcar como entregado
              </BaseButton>
              <BaseButton
                v-else
                size="sm"
                variant="secondary"
                class="w-full justify-center"
                :loading="isUpdatingPrize"
                @click="markPrizePending"
              >
                Marcar como pendiente
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <BaseModal :open="showDrawModal" title="Sortear ganador" @close="showDrawModal = false">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Se elegirá un ganador al azar entre los <strong>{{ eligibleCount }}</strong> clientes elegibles y el sorteo se cerrará. Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="showDrawModal = false">Cancelar</BaseButton>
        <BaseButton @click="confirmDraw">Sortear</BaseButton>
      </template>
    </BaseModal>

    <BaseModal :open="showDeleteModal" title="Eliminar sorteo" @close="showDeleteModal = false">
      <p class="text-sm text-gray-600 dark:text-gray-400">¿Eliminar este sorteo? Esta acción no se puede deshacer.</p>
      <template #footer>
        <BaseButton variant="secondary" @click="showDeleteModal = false">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeleting" @click="confirmDelete">Eliminar</BaseButton>
      </template>
    </BaseModal>

    <RaffleDrawAnimation
      :open="showDrawAnimation"
      :candidates="eligible"
      :winner="drawnWinner"
      :duration-ms="drawAnimationMs"
      @close="closeDrawAnimation"
    />

    <BaseModal :open="showPrizeModal" title="Marcar premio como entregado" @close="showPrizeModal = false">
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Agrega una foto como evidencia de la entrega (opcional).
        </p>
        <ImageUploader v-model="prizeImages" :max="1" />
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showPrizeModal = false">Cancelar</BaseButton>
        <BaseButton :loading="isUpdatingPrize" @click="confirmPrizeDelivered">Confirmar entrega</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
