<script setup lang="ts">
import { defineAsyncComponent, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from 'vue-sonner';
import { branchApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const BranchMapPicker = defineAsyncComponent(() => import('../components/BranchMapPicker.vue'));

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;

const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Requerido').max(100),
    code: z.string().regex(/^[A-Z0-9-]+$/, 'Solo mayúsculas, números y guiones').max(20),
    address: z.string().optional(),
    phone: z.string().max(20).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  }),
);

const { handleSubmit, isSubmitting, setValues, setFieldValue } = useForm({ validationSchema: schema });
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: code, errorMessage: codeError } = useField<string>('code');
const { value: address } = useField<string>('address');
const { value: phone } = useField<string>('phone');
const { value: latitude } = useField<number | null>('latitude');
const { value: longitude } = useField<number | null>('longitude');

onMounted(async () => {
  if (isEdit && id) {
    const branch = await branchApi.getById(id);
    setValues({
      name: branch.name,
      code: branch.code,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
      latitude: branch.latitude,
      longitude: branch.longitude,
    });
  }
});

const onSubmit = handleSubmit(async (values) => {
  try {
    if (isEdit && id) {
      await branchApi.update(id, values);
      toast.success('Sucursal actualizada');
    } else {
      await branchApi.create(values);
      toast.success('Sucursal creada');
    }
    router.push('/branches');
  } catch (e) {
    toast.error(extractApiError(e));
  }
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader :title="isEdit ? 'Editar sucursal' : 'Nueva sucursal'">
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>

    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <form class="space-y-5" @submit.prevent="onSubmit">
        <BaseInput
          v-model="name"
          label="Nombre"
          placeholder="Sucursal Central"
          :error="nameError"
          required
        />
        <BaseInput
          v-model="code"
          label="Código"
          placeholder="BR-001"
          :error="codeError"
          required
          hint="Mayúsculas, números y guiones. Ej: BR-001"
        />
        <BaseInput v-model="address" label="Dirección" placeholder="Av. Lima 456" />
        <BaseInput v-model="phone" label="Teléfono" placeholder="+51999999999" />

        <!-- Map picker -->
        <div>
          <p class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación</p>
          <BranchMapPicker
            :latitude="latitude"
            :longitude="longitude"
            @update:latitude="setFieldValue('latitude', $event)"
            @update:longitude="setFieldValue('longitude', $event)"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="router.back()">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">
            {{ isEdit ? 'Guardar cambios' : 'Crear sucursal' }}
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
