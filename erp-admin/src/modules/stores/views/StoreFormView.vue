<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from 'vue-sonner';
import { storeApi } from '../api';
import { branchApi } from '@/modules/branches/api';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;

const branchOptions = ref<{ label: string; value: string }[]>([]);

const schema = toTypedSchema(z.object({
  branchId: z.string().uuid('Selecciona una sucursal'),
  name: z.string().min(1).max(100),
  code: z.string().regex(/^[A-Z0-9-]+$/, 'Solo mayúsculas, números y guiones').max(20),
  address: z.string().optional(),
}));

const { handleSubmit, isSubmitting, setValues } = useForm({ validationSchema: schema });
const { value: branchId, errorMessage: branchError } = useField<string>('branchId');
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: code, errorMessage: codeError } = useField<string>('code');
const { value: address } = useField<string>('address');

onMounted(async () => {
  const branches = await branchApi.getAll({ limit: 100 });
  branchOptions.value = branches.items.map((b) => ({ label: b.name, value: b.id }));

  if (isEdit && id) {
    const s = await storeApi.getById(id);
    setValues({ branchId: s.branchId, name: s.name, code: s.code, address: s.address ?? '' });
  }
});

const onSubmit = handleSubmit(async (values) => {
  try {
    if (isEdit && id) {
      await storeApi.update(id, values);
      toast.success('Tienda actualizada');
    } else {
      await storeApi.create(values);
      toast.success('Tienda creada');
    }
    router.push('/stores');
  } catch (e) { toast.error(extractApiError(e)); }
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader :title="isEdit ? 'Editar tienda' : 'Nueva tienda'">
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <form class="space-y-5" @submit.prevent="onSubmit">
        <BaseSelect v-model="branchId" label="Sucursal" placeholder="Selecciona una sucursal" :options="branchOptions" :error="branchError" required />
        <BaseInput v-model="name" label="Nombre" placeholder="Tienda Centro" :error="nameError" required />
        <BaseInput v-model="code" label="Código" placeholder="ST-001" :error="codeError" required />
        <BaseInput v-model="address" label="Dirección" placeholder="Jr. Comercio 789" />
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="router.back()">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">{{ isEdit ? 'Guardar' : 'Crear tienda' }}</BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
