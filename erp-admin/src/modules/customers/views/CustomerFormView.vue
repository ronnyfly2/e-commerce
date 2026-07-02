<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from '@/shared/composables/useToast';
import { customerApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;

const schema = toTypedSchema(z.object({
  name: z.string().min(1).max(150),
  phone: z.string().min(1).max(30),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().optional(),
}));

const { handleSubmit, isSubmitting, setValues } = useForm({ validationSchema: schema });
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: phone, errorMessage: phoneError } = useField<string>('phone');
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: notes } = useField<string>('notes');

onMounted(async () => {
  if (isEdit && id) {
    const c = await customerApi.getById(id);
    setValues({ name: c.name, phone: c.phone, email: c.email ?? '', notes: c.notes ?? '' });
  }
});

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = { ...values, email: values.email || undefined, notes: values.notes || undefined };
    if (isEdit && id) { await customerApi.update(id, payload); toast.success('Cliente actualizado'); }
    else { await customerApi.create(payload as { name: string; phone: string }); toast.success('Cliente creado'); }
    router.push('/customers');
  } catch (e) { toast.error(extractApiError(e)); }
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader :title="isEdit ? 'Editar cliente' : 'Nuevo cliente'">
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <form class="space-y-5" @submit.prevent="onSubmit">
        <BaseInput v-model="name" label="Nombre" placeholder="Juan Pérez" :error="nameError" required />
        <BaseInput v-model="phone" label="Teléfono" placeholder="+51999000111" :error="phoneError" required hint="Se usa para vincular mensajes de WhatsApp automáticamente" />
        <BaseInput v-model="email" label="Email" type="email" placeholder="juan@ejemplo.com" :error="emailError" />
        <BaseInput v-model="notes" label="Notas" placeholder="Notas internas opcionales" />
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="router.back()">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">{{ isEdit ? 'Guardar' : 'Crear cliente' }}</BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
