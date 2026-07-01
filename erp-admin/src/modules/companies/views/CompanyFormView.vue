<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from '@/shared/composables/useToast';
import { companyApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;

const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Requerido').max(100),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones').max(100),
    ruc: z.string().min(1, 'Requerido').max(20),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    address: z.string().optional(),
  }),
);

const { handleSubmit, isSubmitting, setValues } = useForm({ validationSchema: schema });

const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: slug, errorMessage: slugError } = useField<string>('slug');
const { value: ruc, errorMessage: rucError } = useField<string>('ruc');
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: phone } = useField<string>('phone');
const { value: address } = useField<string>('address');

onMounted(async () => {
  if (isEdit && id) {
    const company = await companyApi.getById(id);
    setValues({
      name: company.name,
      slug: company.slug,
      ruc: company.ruc,
      email: company.email ?? '',
      phone: company.phone ?? '',
      address: company.address ?? '',
    });
  }
});

const onSubmit = handleSubmit(async (values) => {
  try {
    if (isEdit && id) {
      await companyApi.update(id, values);
      toast.success('Empresa actualizada');
    } else {
      await companyApi.create(values);
      toast.success('Empresa creada');
    }
    router.push('/companies');
  } catch (e) {
    toast.error(extractApiError(e));
  }
});

function autoSlug(val: string) {
  if (!isEdit) {
    slug.value = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader
      :title="isEdit ? 'Editar empresa' : 'Nueva empresa'"
      :description="isEdit ? 'Modifica los datos de la empresa' : 'Completa el formulario para registrar una nueva empresa'"
    >
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>

    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <form class="space-y-5" @submit.prevent="onSubmit">
        <BaseInput
          v-model="name"
          label="Nombre"
          placeholder="Acme Corp"
          :error="nameError"
          required
          @update:model-value="autoSlug"
        />
        <BaseInput
          v-model="slug"
          label="Slug (URL)"
          placeholder="acme-corp"
          :error="slugError"
          required
        />
        <BaseInput
          v-model="ruc"
          label="RUC"
          placeholder="20123456789"
          :error="rucError"
          required
        />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput
            v-model="email"
            label="Email"
            type="email"
            placeholder="contacto@empresa.com"
            :error="emailError"
          />
          <BaseInput
            v-model="phone"
            label="Teléfono"
            placeholder="+51999999999"
          />
        </div>
        <BaseInput
          v-model="address"
          label="Dirección"
          placeholder="Av. Principal 123"
        />

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="router.back()">
            Cancelar
          </BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">
            {{ isEdit ? 'Guardar cambios' : 'Crear empresa' }}
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
