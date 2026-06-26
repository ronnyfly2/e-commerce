<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from 'vue-sonner';
import { brandApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;

const schema = toTypedSchema(z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones').max(100),
  description: z.string().optional(),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
}));

const { handleSubmit, isSubmitting, setValues } = useForm({ validationSchema: schema });
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: slug, errorMessage: slugError } = useField<string>('slug');
const { value: description } = useField<string>('description');
const { value: logoUrl, errorMessage: logoError } = useField<string>('logoUrl');

onMounted(async () => {
  if (isEdit && id) {
    const b = await brandApi.getById(id);
    setValues({ name: b.name, slug: b.slug, description: b.description ?? '', logoUrl: b.logoUrl ?? '' });
  }
});

function autoSlug(val: string) {
  if (!isEdit) slug.value = val.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = { ...values, logoUrl: values.logoUrl || undefined, description: values.description || undefined };
    if (isEdit && id) { await brandApi.update(id, payload); toast.success('Marca actualizada'); }
    else { await brandApi.create(payload as { name: string; slug: string }); toast.success('Marca creada'); }
    router.push('/brands');
  } catch (e) { toast.error(extractApiError(e)); }
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader :title="isEdit ? 'Editar marca' : 'Nueva marca'">
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <form class="space-y-5" @submit.prevent="onSubmit">
        <BaseInput v-model="name" label="Nombre" placeholder="Nike" :error="nameError" required @update:model-value="autoSlug" />
        <BaseInput v-model="slug" label="Slug" placeholder="nike" :error="slugError" required />
        <BaseInput v-model="logoUrl" label="URL del logo" placeholder="https://..." :error="logoError" />
        <BaseInput v-model="description" label="Descripción" placeholder="Descripción opcional" />
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="router.back()">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">{{ isEdit ? 'Guardar' : 'Crear marca' }}</BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
