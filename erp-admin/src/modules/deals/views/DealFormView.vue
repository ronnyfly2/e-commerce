<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from '@/shared/composables/useToast';
import { dealApi } from '../api';
import { customerApi } from '@/modules/customers/api';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();

const customerOptions = ref<{ label: string; value: string }[]>([]);

const schema = toTypedSchema(z.object({
  customerId: z.string().uuid('Selecciona un cliente'),
  title: z.string().min(1).max(150),
  value: z.coerce.number().positive().optional().or(z.literal('')),
  currencyCode: z.string().max(3),
  notes: z.string().optional(),
  expectedCloseDate: z.string().optional(),
}));

const { handleSubmit, isSubmitting, setValues } = useForm({ validationSchema: schema });
const { value: customerId, errorMessage: customerError } = useField<string>('customerId');
const { value: title, errorMessage: titleError } = useField<string>('title');
const { value: value_, errorMessage: valueError } = useField<number | ''>('value');
const { value: currencyCode } = useField<string>('currencyCode');
const { value: notes } = useField<string>('notes');
const { value: expectedCloseDate } = useField<string>('expectedCloseDate');

onMounted(async () => {
  const customers = await customerApi.getAll({ limit: 100 });
  customerOptions.value = customers.items.map((c) => ({ label: `${c.name} (${c.phone})`, value: c.id }));

  setValues({ currencyCode: 'USD' });
  const preselected = route.query.customerId as string | undefined;
  if (preselected) setValues({ customerId: preselected });
});

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      ...values,
      value: values.value !== '' ? Number(values.value) : undefined,
      notes: values.notes || undefined,
      expectedCloseDate: values.expectedCloseDate || undefined,
    };
    const deal = await dealApi.create(payload);
    toast.success('Oportunidad creada');
    router.push(`/customers/${deal.customerId}`);
  } catch (e) { toast.error(extractApiError(e)); }
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader title="Nueva oportunidad">
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <form class="space-y-5" @submit.prevent="onSubmit">
        <BaseSelect v-model="customerId" label="Cliente" placeholder="Selecciona un cliente" :options="customerOptions" :error="customerError" required />
        <BaseInput v-model="title" label="Título" placeholder="Pedido al por mayor — 50 poleras" :error="titleError" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model.number="value_" label="Valor estimado" type="number" step="0.01" placeholder="0.00" :error="valueError" />
          <BaseInput v-model="currencyCode" label="Moneda" placeholder="USD" />
        </div>
        <BaseInput v-model="expectedCloseDate" label="Fecha estimada de cierre" type="date" />
        <BaseInput v-model="notes" label="Notas" placeholder="Notas opcionales" />
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="router.back()">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">Crear oportunidad</BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
