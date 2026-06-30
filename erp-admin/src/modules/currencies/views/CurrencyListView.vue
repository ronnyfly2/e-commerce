<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import {
  PlusIcon,
  PencilIcon,
  StarIcon,
} from '@heroicons/vue/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/vue/24/solid';
import { currencyApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import type { Currency } from '../types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseBadge from '@/shared/components/ui/BaseBadge.vue';
import EmptyState from '@/shared/components/feedback/EmptyState.vue';
import ErrorAlert from '@/shared/components/feedback/ErrorAlert.vue';
import BaseModal from '@/shared/components/ui/BaseModal.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import { useAuthStore } from '@/shared/stores/auth.store';

const auth = useAuthStore();
const canManage = auth.hasPermission('currency:create');

const list = ref<Currency[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// ─── Create modal ──────────────────────────────────────────────────────────
const showCreate = ref(false);

const createSchema = toTypedSchema(
  z.object({
    code:         z.string().min(2).max(3).transform((v) => v.toUpperCase()),
    name:         z.string().min(2).max(100),
    symbol:       z.string().min(1).max(10),
    exchangeRate: z.coerce.number().positive(),
  }),
);
const { handleSubmit: handleCreate, isSubmitting: isCreating, resetForm: resetCreate } = useForm({ validationSchema: createSchema });
const { value: newCode,  errorMessage: codeErr }  = useField<string>('code');
const { value: newName,  errorMessage: nameErr }  = useField<string>('name');
const { value: newSymbol, errorMessage: symbolErr } = useField<string>('symbol');
const { value: newRate,  errorMessage: rateErr }  = useField<string>('exchangeRate');

const submitCreate = handleCreate(async (values) => {
  try {
    const created = await currencyApi.create(values);
    list.value = [...list.value, created].sort(sortFn);
    toast.success(`Moneda ${created.code} creada`);
    showCreate.value = false;
    resetCreate();
  } catch (e) {
    toast.error(extractApiError(e));
  }
});

// ─── Edit modal ────────────────────────────────────────────────────────────
const editTarget = ref<Currency | null>(null);

const editSchema = toTypedSchema(
  z.object({
    name:         z.string().min(2).max(100),
    symbol:       z.string().min(1).max(10),
    exchangeRate: z.coerce.number().positive(),
  }),
);
const { handleSubmit: handleEdit, isSubmitting: isEditing, resetForm: resetEdit, setValues } = useForm({ validationSchema: editSchema });
const { value: editName,   errorMessage: editNameErr }   = useField<string>('name');
const { value: editSymbol, errorMessage: editSymbolErr } = useField<string>('symbol');
const { value: editRate,   errorMessage: editRateErr }   = useField<string>('exchangeRate');

function openEdit(c: Currency) {
  editTarget.value = c;
  setValues({ name: c.name, symbol: c.symbol, exchangeRate: c.exchangeRate });
}

const submitEdit = handleEdit(async (values) => {
  if (!editTarget.value) return;
  try {
    const updated = await currencyApi.update(editTarget.value.id, values);
    replace(updated);
    toast.success(`${updated.code} actualizado`);
    editTarget.value = null;
    resetEdit();
  } catch (e) {
    toast.error(extractApiError(e));
  }
});

// ─── Set default ───────────────────────────────────────────────────────────
const settingDefault = ref<string | null>(null);

async function setDefault(c: Currency) {
  if (c.isDefault) return;
  settingDefault.value = c.id;
  try {
    const updated = await currencyApi.setDefault(c.id);
    list.value = list.value.map((x) =>
      x.id === updated.id ? updated : { ...x, isDefault: false },
    );
    list.value.sort(sortFn);
    toast.success(`${updated.code} es ahora la moneda por defecto`);
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    settingDefault.value = null;
  }
}

// ─── Toggle active ─────────────────────────────────────────────────────────
const togglingId = ref<string | null>(null);

async function toggleActive(c: Currency) {
  togglingId.value = c.id;
  try {
    const updated = await currencyApi.update(c.id, { isActive: !c.isActive });
    replace(updated);
    toast.success(`${updated.code} ${updated.isActive ? 'activado' : 'desactivado'}`);
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    togglingId.value = null;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function replace(updated: Currency) {
  list.value = list.value.map((x) => (x.id === updated.id ? updated : x)).sort(sortFn);
}

function sortFn(a: Currency, b: Currency) {
  if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
  return a.code.localeCompare(b.code);
}

// ─── Load ──────────────────────────────────────────────────────────────────
onMounted(load);

async function load() {
  isLoading.value = true;
  error.value = null;
  try {
    list.value = await currencyApi.getAll();
  } catch (e) {
    error.value = extractApiError(e);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader title="Monedas" description="Tipos de moneda y tasas de cambio relativas al USD">
      <BaseButton v-if="canManage" @click="showCreate = true">
        <PlusIcon class="h-4 w-4" />
        Nueva moneda
      </BaseButton>
    </PageHeader>

    <ErrorAlert v-if="error" :message="error" @retry="load" />

    <div v-if="!error" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div v-if="isLoading" class="flex h-48 items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>

      <template v-else>
        <EmptyState v-if="list.length === 0">
          <BaseButton v-if="canManage" @click="showCreate = true">
            <PlusIcon class="h-4 w-4" />
            Agregar primera moneda
          </BaseButton>
        </EmptyState>

        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Moneda</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Símbolo</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tasa (vs USD)</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Por defecto</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
              <th v-if="canManage" class="px-6 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="c in list" :key="c.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <!-- Moneda -->
              <td class="whitespace-nowrap px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700 text-xs font-bold dark:bg-primary-900/30 dark:text-primary-400">
                    {{ c.code }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ c.code }}</p>
                    <p class="text-xs text-gray-500">{{ c.name }}</p>
                  </div>
                </div>
              </td>

              <!-- Símbolo -->
              <td class="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-700 dark:text-gray-300">
                {{ c.symbol }}
              </td>

              <!-- Tasa -->
              <td class="whitespace-nowrap px-6 py-4 text-sm tabular-nums text-gray-700 dark:text-gray-300">
                {{ c.code === 'USD' ? '1.000000' : Number(c.exchangeRate).toFixed(6) }}
              </td>

              <!-- Por defecto -->
              <td class="whitespace-nowrap px-6 py-4">
                <button
                  v-if="canManage"
                  type="button"
                  :disabled="c.isDefault || settingDefault === c.id"
                  class="rounded p-1 transition-colors"
                  :class="c.isDefault
                    ? 'text-amber-500 cursor-default'
                    : 'text-gray-300 hover:text-amber-400 dark:text-gray-600'"
                  :title="c.isDefault ? 'Moneda por defecto' : 'Establecer como defecto'"
                  @click="setDefault(c)"
                >
                  <StarSolidIcon v-if="c.isDefault" class="h-5 w-5" />
                  <StarIcon v-else class="h-5 w-5" />
                </button>
                <BaseBadge v-else-if="c.isDefault" variant="warning">Default</BaseBadge>
                <span v-else class="text-gray-400">—</span>
              </td>

              <!-- Estado -->
              <td class="whitespace-nowrap px-6 py-4">
                <BaseBadge :variant="c.isActive ? 'success' : 'danger'">
                  {{ c.isActive ? 'Activo' : 'Inactivo' }}
                </BaseBadge>
              </td>

              <!-- Acciones -->
              <td v-if="canManage" class="whitespace-nowrap px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                    title="Editar"
                    @click="openEdit(c)"
                  >
                    <PencilIcon class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    :disabled="c.isDefault || togglingId === c.id"
                    class="rounded px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    :class="c.isActive
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'"
                    :title="c.isDefault ? 'La moneda por defecto no puede desactivarse' : ''"
                    @click="toggleActive(c)"
                  >
                    {{ c.isActive ? 'Desactivar' : 'Activar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>

    <!-- ─── Create modal ──────────────────────────────────────────────────── -->
    <BaseModal :open="showCreate" title="Nueva moneda" @close="showCreate = false; resetCreate()">
      <form class="space-y-4" @submit.prevent="submitCreate">
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="newCode" label="Código ISO" placeholder="USD" :error="codeErr" required />
          <BaseInput v-model="newSymbol" label="Símbolo" placeholder="$" :error="symbolErr" required />
        </div>
        <BaseInput v-model="newName" label="Nombre" placeholder="Dólar Estadounidense" :error="nameErr" required />
        <BaseInput v-model="newRate" label="Tasa de cambio (relativa al USD)" type="number" step="0.000001" placeholder="1.000000" :error="rateErr" required />
        <p class="text-xs text-gray-500 dark:text-gray-400">Ejemplo: USD = 1, PEN = 3.71 significa que 1 USD equivale a 3.71 PEN.</p>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="showCreate = false; resetCreate()">Cancelar</BaseButton>
        <BaseButton :loading="isCreating" @click="submitCreate">Crear</BaseButton>
      </template>
    </BaseModal>

    <!-- ─── Edit modal ────────────────────────────────────────────────────── -->
    <BaseModal :open="!!editTarget" :title="`Editar ${editTarget?.code ?? ''}`" @close="editTarget = null; resetEdit()">
      <form class="space-y-4" @submit.prevent="submitEdit">
        <BaseInput v-model="editSymbol" label="Símbolo" :error="editSymbolErr" required />
        <BaseInput v-model="editName" label="Nombre" :error="editNameErr" required />
        <BaseInput v-model="editRate" label="Tasa de cambio (relativa al USD)" type="number" step="0.000001" :error="editRateErr" required />
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="editTarget = null; resetEdit()">Cancelar</BaseButton>
        <BaseButton :loading="isEditing" @click="submitEdit">Guardar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
