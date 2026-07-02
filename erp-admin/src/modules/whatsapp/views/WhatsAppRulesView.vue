<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { toast } from '@/shared/composables/useToast';
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { whatsappApi } from '../api';
import type { AutoReplyRule } from '../types';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseBadge from '@/shared/components/ui/BaseBadge.vue';
import ErrorAlert from '@/shared/components/feedback/ErrorAlert.vue';

const rules = ref<AutoReplyRule[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const newKeyword = ref('');
const newReply = ref('');
const isCreating = ref(false);

onMounted(load);

async function load() {
  isLoading.value = true; error.value = null;
  try {
    rules.value = await whatsappApi.getRules();
  } catch (e) { error.value = extractApiError(e); }
  finally { isLoading.value = false; }
}

async function createRule() {
  const keyword = newKeyword.value.trim();
  const replyText = newReply.value.trim();
  if (!keyword || !replyText) return;
  isCreating.value = true;
  try {
    const rule = await whatsappApi.createRule({ keyword, replyText, sortOrder: rules.value.length });
    rules.value.push(rule);
    newKeyword.value = '';
    newReply.value = '';
  } catch (e) { toast.error(extractApiError(e)); }
  finally { isCreating.value = false; }
}

async function toggleActive(rule: AutoReplyRule) {
  try {
    const updated = await whatsappApi.updateRule(rule.id, { isActive: !rule.isActive });
    rules.value = rules.value.map((r) => (r.id === updated.id ? updated : r));
  } catch (e) { toast.error(extractApiError(e)); }
}

async function removeRule(rule: AutoReplyRule) {
  try {
    await whatsappApi.removeRule(rule.id);
    rules.value = rules.value.filter((r) => r.id !== rule.id);
  } catch (e) { toast.error(extractApiError(e)); }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <PageHeader
      title="Respuestas automáticas de WhatsApp"
      description="Si el mensaje del cliente contiene la palabra clave, se responde automáticamente con el texto configurado"
    />

    <ErrorAlert v-if="error" :message="error" @retry="load" />

    <div v-if="isLoading" class="flex h-32 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>

    <div v-else-if="!error" class="space-y-4">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Agregar regla</h3>
        <div class="flex items-end gap-2">
          <div class="w-1/3">
            <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">Palabra clave</label>
            <input v-model="newKeyword" type="text" placeholder="horario" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
          </div>
          <div class="flex-1">
            <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">Respuesta</label>
            <input v-model="newReply" type="text" placeholder="Atendemos de lunes a sábado, 9am a 7pm." class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
          </div>
          <BaseButton type="button" :loading="isCreating" @click="createRule"><PlusIcon class="h-4 w-4" /> Agregar</BaseButton>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <p v-if="rules.length === 0" class="p-6 text-center text-sm text-gray-400">Sin reglas configuradas — todos los mensajes esperan respuesta manual</p>
        <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Palabra clave</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Respuesta</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
              <th class="px-6 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="rule in rules" :key="rule.id">
              <td class="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ rule.keyword }}</td>
              <td class="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{{ rule.replyText }}</td>
              <td class="px-6 py-3">
                <button type="button" @click="toggleActive(rule)">
                  <BaseBadge :variant="rule.isActive ? 'success' : 'danger'">{{ rule.isActive ? 'Activa' : 'Inactiva' }}</BaseBadge>
                </button>
              </td>
              <td class="px-6 py-3 text-right">
                <button type="button" class="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" @click="removeRule(rule)">
                  <TrashIcon class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
