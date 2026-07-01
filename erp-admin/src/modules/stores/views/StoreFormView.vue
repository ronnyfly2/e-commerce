<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from '@/shared/composables/useToast';
import { storeApi } from '../api';
import { branchApi } from '@/modules/branches/api';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const AddressMapPicker = defineAsyncComponent(() => import('@/shared/components/common/AddressMapPicker.vue'));

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
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
}));

const { handleSubmit, isSubmitting, setValues, setFieldValue } = useForm({ validationSchema: schema });
const { value: branchId, errorMessage: branchError } = useField<string>('branchId');
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: code, errorMessage: codeError } = useField<string>('code');
const { value: address } = useField<string>('address');
const { value: latitude } = useField<number | null>('latitude');
const { value: longitude } = useField<number | null>('longitude');

onMounted(async () => {
  const branches = await branchApi.getAll({ limit: 100 });
  branchOptions.value = branches.items.map((b) => ({ label: b.name, value: b.id }));

  if (isEdit && id) {
    const s = await storeApi.getById(id);
    setValues({
      branchId: s.branchId,
      name: s.name,
      code: s.code,
      address: s.address ?? '',
      latitude: s.latitude,
      longitude: s.longitude,
    });
  }
});

const onSubmit = handleSubmit(async (values) => {
  try {
    const { latitude, longitude, address, ...required } = values;
    const payload = {
      ...required,
      ...(address ? { address } : {}),
      ...(latitude != null ? { latitude: parseFloat(latitude.toFixed(7)) } : {}),
      ...(longitude != null ? { longitude: parseFloat(longitude.toFixed(7)) } : {}),
    };
    if (isEdit && id) {
      await storeApi.update(id, payload);
      toast.success('Tienda actualizada');
    } else {
      await storeApi.create(payload);
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

        <!-- Map picker -->
        <div>
          <p class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación</p>
          <AddressMapPicker
            :latitude="latitude"
            :longitude="longitude"
            @update:latitude="setFieldValue('latitude', $event)"
            @update:longitude="setFieldValue('longitude', $event)"
            @update:address="setFieldValue('address', $event)"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="router.back()">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">{{ isEdit ? 'Guardar' : 'Crear tienda' }}</BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
