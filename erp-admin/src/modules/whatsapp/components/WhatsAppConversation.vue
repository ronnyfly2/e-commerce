<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { toast } from '@/shared/composables/useToast';
import { useAuthStore } from '@/shared/stores/auth.store';
import { extractApiError } from '@/shared/types/api.types';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import { whatsappApi } from '../api';
import type { WhatsAppMessage } from '../types';

const { customerId } = defineProps<{ customerId: string }>();

const auth = useAuthStore();
const canSend = auth.hasPermission('customer:update');

const messages = ref<WhatsAppMessage[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const draft = ref('');
const isSending = ref(false);

async function load() {
  isLoading.value = true;
  error.value = null;
  try {
    messages.value = await whatsappApi.getMessages(customerId);
  } catch (e) {
    error.value = extractApiError(e);
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);

async function send() {
  const body = draft.value.trim();
  if (!body) return;
  isSending.value = true;
  try {
    const sent = await whatsappApi.sendMessage(customerId, body);
    messages.value.push(sent);
    draft.value = '';
  } catch (e) {
    toast.error(extractApiError(e));
  } finally {
    isSending.value = false;
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <div>
    <div v-if="isLoading" class="py-6 text-center text-sm text-gray-400">Cargando conversación…</div>
    <div v-else-if="error" class="py-6 text-center text-sm text-red-500">
      {{ error }}
      <button type="button" class="ml-1 underline" @click="load">Reintentar</button>
    </div>
    <template v-else>
      <div v-if="messages.length === 0" class="py-6 text-center text-xs text-gray-400">
        Sin mensajes de WhatsApp con este cliente todavía.
      </div>
      <div v-else class="mb-4 max-h-96 space-y-2 overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div
          v-for="m in messages"
          :key="m.id"
          class="flex"
          :class="m.direction === 'out' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[75%] rounded-lg px-3 py-2 text-sm"
            :class="m.direction === 'out'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-100'"
          >
            <p class="whitespace-pre-wrap">{{ m.body }}</p>
            <p class="mt-1 text-[10px] opacity-70">
              {{ formatTime(m.createdAt) }}
              <span v-if="m.autoReplied">· automático</span>
            </p>
          </div>
        </div>
      </div>

      <div v-if="canSend" class="flex gap-2">
        <textarea
          v-model="draft"
          rows="2"
          placeholder="Escribe una respuesta…"
          class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          @keydown.enter.exact.prevent="send"
        />
        <BaseButton type="button" :loading="isSending" @click="send">Enviar</BaseButton>
      </div>
    </template>
  </div>
</template>
