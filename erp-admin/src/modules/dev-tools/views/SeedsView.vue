<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { toast } from '@/shared/composables/useToast';
import { PlayIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import { devToolsApi } from '../api';
import { seedStatusLabel, WIPE_DATABASE_CONFIRMATION_PHRASE, type SeedStatus } from '../types';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseBadge from '@/shared/components/ui/BaseBadge.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseModal from '@/shared/components/ui/BaseModal.vue';
import ErrorAlert from '@/shared/components/feedback/ErrorAlert.vue';

const seeds = ref<SeedStatus[]>([]);
const isLoading = ref(false);
const isRunningAll = ref(false);
const runningId = ref<string | null>(null);
const error = ref<string | null>(null);
const deleteTarget = ref<SeedStatus | null>(null);
const isDeleting = ref(false);
const showWipeModal = ref(false);
const wipeConfirmInput = ref('');
const isWiping = ref(false);

onMounted(load);

async function load() {
  isLoading.value = true;
  error.value = null;
  try {
    seeds.value = await devToolsApi.list();
  } catch (e) {
    error.value = extractApiError(e);
  } finally {
    isLoading.value = false;
  }
}

const badgeVariant: Record<ReturnType<typeof seedStatusLabel>, 'success' | 'warning' | 'default'> = {
  Aplicado: 'success',
  Parcial: 'warning',
  'No aplicado': 'default',
};

async function runAll() {
  isRunningAll.value = true;
  try {
    seeds.value = await devToolsApi.runAll();
    toast.success('Todos los seeds ejecutados');
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isRunningAll.value = false;
  }
}

async function runOne(seed: SeedStatus) {
  runningId.value = seed.id;
  try {
    seeds.value = await devToolsApi.runOne(seed.id);
    toast.success(`"${seed.name}" ejecutado`);
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    runningId.value = null;
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  isDeleting.value = true;
  try {
    seeds.value = await devToolsApi.deleteOne(deleteTarget.value.id);
    toast.success(`Datos de "${deleteTarget.value.name}" eliminados`);
    deleteTarget.value = null;
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isDeleting.value = false;
  }
}

const wipeConfirmMatches = computed(() => wipeConfirmInput.value === WIPE_DATABASE_CONFIRMATION_PHRASE);

function openWipeModal() {
  wipeConfirmInput.value = '';
  showWipeModal.value = true;
}

async function confirmWipe() {
  if (!wipeConfirmMatches.value) return;
  isWiping.value = true;
  try {
    const result = await devToolsApi.wipeDatabase(wipeConfirmInput.value);
    toast.success(`Base de datos vaciada — ${result.truncatedTables.length} tablas`);
    showWipeModal.value = false;
    await load();
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isWiping.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader title="Seeds" description="Herramientas de datos de ejemplo — solo disponible fuera de producción">
      <BaseButton :loading="isRunningAll" @click="runAll">
        <PlayIcon class="h-4 w-4" /> Ejecutar todos
      </BaseButton>
    </PageHeader>

    <ErrorAlert v-if="error" :message="error" @retry="load" />

    <div v-if="!error" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div v-if="isLoading" class="flex h-48 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
      <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Seed</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
            <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Registros</th>
            <th class="px-6 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="seed in seeds" :key="seed.id">
            <td class="px-6 py-4">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ seed.name }}</p>
              <p class="text-xs text-gray-500">{{ seed.description }}</p>
            </td>
            <td class="whitespace-nowrap px-6 py-4">
              <BaseBadge :variant="badgeVariant[seedStatusLabel(seed)]">{{ seedStatusLabel(seed) }}</BaseBadge>
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-400">
              {{ seed.appliedCount }} / {{ seed.expectedCount }}
            </td>
            <td class="whitespace-nowrap px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <BaseButton size="sm" variant="secondary" :loading="runningId === seed.id" @click="runOne(seed)">
                  <PlayIcon class="h-4 w-4" /> Ejecutar
                </BaseButton>
                <BaseButton
                  size="sm"
                  variant="danger"
                  :disabled="!seed.deletable || seed.appliedCount === 0"
                  :title="!seed.deletable ? 'Este seed es fundacional y no se puede eliminar individualmente' : undefined"
                  @click="deleteTarget = seed"
                >
                  <TrashIcon class="h-4 w-4" /> Eliminar datos
                </BaseButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Danger zone -->
    <div class="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/10">
      <div class="mb-2 flex items-center gap-2">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-600 dark:text-red-400" />
        <h3 class="text-sm font-semibold text-red-900 dark:text-red-300">Zona de peligro</h3>
      </div>
      <p class="mb-4 text-sm text-red-700 dark:text-red-400">
        Vacía <strong>todas</strong> las tablas de negocio (pedidos, productos, clientes, sorteos, etc.) manteniendo el esquema y el historial de migraciones intactos. Esta acción no se puede deshacer.
      </p>
      <BaseButton variant="danger" @click="openWipeModal">
        <TrashIcon class="h-4 w-4" /> Vaciar toda la base de datos
      </BaseButton>
    </div>

    <!-- Delete one seed's data -->
    <BaseModal :open="!!deleteTarget" title="Eliminar datos del seed" @close="deleteTarget = null">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        ¿Eliminar los datos creados por <strong>{{ deleteTarget?.name }}</strong>? Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="deleteTarget = null">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="isDeleting" @click="confirmDelete">Eliminar</BaseButton>
      </template>
    </BaseModal>

    <!-- Wipe database -->
    <BaseModal :open="showWipeModal" title="Vaciar toda la base de datos" size="lg" @close="showWipeModal = false">
      <div class="space-y-4">
        <p class="text-sm text-red-700 dark:text-red-400">
          Esto eliminará <strong>todos</strong> los datos de negocio de la base de datos actual, sin posibilidad de deshacer. Escribe
          <code class="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs dark:bg-red-900/40">{{ WIPE_DATABASE_CONFIRMATION_PHRASE }}</code>
          para confirmar.
        </p>
        <BaseInput v-model="wipeConfirmInput" label="Confirmación" :placeholder="WIPE_DATABASE_CONFIRMATION_PHRASE" />
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showWipeModal = false">Cancelar</BaseButton>
        <BaseButton variant="danger" :disabled="!wipeConfirmMatches" :loading="isWiping" @click="confirmWipe">
          Vaciar base de datos
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
