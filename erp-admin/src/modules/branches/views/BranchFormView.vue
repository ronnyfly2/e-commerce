<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from '@/shared/composables/useToast';
import { useAuthStore } from '@/shared/stores/auth.store';
import { branchApi } from '../api';
import { companyApi } from '@/modules/companies/api';
import type { Company } from '@/modules/companies/types';
import { extractApiErrorList } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const BranchMapPicker = defineAsyncComponent(() => import('../components/BranchMapPicker.vue'));

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;

const authStore = useAuthStore();
const isSuperAdmin = computed(() => authStore.user?.isSuperAdmin ?? false);
const companies = ref<Company[]>([]);
const companyOptions = computed(() =>
  companies.value.map((c) => ({ label: c.name, value: c.id })),
);

const schema = toTypedSchema(
  z.object({
    companyId: isSuperAdmin.value ? z.uuid('Selecciona una empresa') : z.string().optional(),
    name: z.string().min(1, 'Requerido').max(100),
    code: z.string().regex(/^[A-Z0-9-]+$/, 'Solo mayúsculas, números y guiones').max(20),
    address: z.string().optional(),
    phone: z.string().max(20).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  }),
);

const { handleSubmit, isSubmitting, setValues, setFieldValue } = useForm({ validationSchema: schema });
const { value: companyId, errorMessage: companyIdError } = useField<string>('companyId');
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: code, errorMessage: codeError } = useField<string>('code');
const { value: address } = useField<string>('address');
const { value: phone } = useField<string>('phone');
const { value: latitude } = useField<number | null>('latitude');
const { value: longitude } = useField<number | null>('longitude');

onMounted(async () => {
  if (isSuperAdmin.value) {
    const result = await companyApi.getAll({ limit: 100 });
    companies.value = result.items;
  }

  if (isEdit && id) {
    const branch = await branchApi.getById(id);
    setValues({
      companyId: branch.companyId,
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
    const { latitude, longitude, address, phone, companyId, ...required } = values;
    const payload = {
      ...required,
      ...(isSuperAdmin.value && companyId ? { companyId } : {}),
      ...(address ? { address } : {}),
      ...(phone ? { phone } : {}),
      ...(latitude != null ? { latitude: parseFloat(latitude.toFixed(7)) } : {}),
      ...(longitude != null ? { longitude: parseFloat(longitude.toFixed(7)) } : {}),
    };
    if (isEdit && id) {
      await branchApi.update(id, payload);
      toast.success('Sucursal actualizada');
    } else {
      await branchApi.create(payload);
      toast.success('Sucursal creada');
    }
    router.push('/branches');
  } catch (e) {
    toast.errors(extractApiErrorList(e));
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
        <BaseSelect
          v-if="isSuperAdmin"
          v-model="companyId"
          label="Empresa"
          placeholder="Selecciona una empresa"
          :options="companyOptions"
          :error="companyIdError"
          required
        />
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
            @update:address="setFieldValue('address', $event)"
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
