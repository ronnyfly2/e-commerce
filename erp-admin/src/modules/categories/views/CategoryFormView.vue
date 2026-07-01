<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from '@/shared/composables/useToast';
import { categoryApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import type { Category } from '../types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import ImageUploader from '@/shared/components/common/ImageUploader.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;

const parentOptions = ref<{ label: string; value: string }[]>([]);
const image = ref<string[]>([]);

const schema = toTypedSchema(z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones').max(100),
  parentId: z.string().uuid().optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0),
}));

const { handleSubmit, isSubmitting, setValues } = useForm({ validationSchema: schema });
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: slug, errorMessage: slugError } = useField<string>('slug');
const { value: parentId } = useField<string>('parentId');
const { value: sortOrder } = useField<number>('sortOrder');

onMounted(async () => {
  const allCats = await categoryApi.getAll({ limit: 100 });
  parentOptions.value = [
    { label: '— Sin padre (raíz) —', value: '' },
    ...allCats.items
      .filter((c: Category) => c.id !== id)
      .map((c: Category) => ({ label: c.name, value: c.id })),
  ];

  if (isEdit && id) {
    const c = await categoryApi.getById(id);
    setValues({ name: c.name, slug: c.slug, parentId: c.parentId ?? '', sortOrder: c.sortOrder });
    image.value = c.imageUrl ? [c.imageUrl] : [];
  } else {
    setValues({ sortOrder: 0, parentId: '' });
  }
});

function autoSlug(val: string) {
  if (!isEdit) slug.value = val.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = { ...values, parentId: values.parentId || undefined, imageUrl: image.value[0] || undefined };
    if (isEdit && id) { await categoryApi.update(id, payload); toast.success('Categoría actualizada'); }
    else { await categoryApi.create(payload as { name: string; slug: string }); toast.success('Categoría creada'); }
    router.push('/categories');
  } catch (e) { toast.error(extractApiError(e)); }
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader :title="isEdit ? 'Editar categoría' : 'Nueva categoría'">
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <form class="space-y-5" @submit.prevent="onSubmit">
        <BaseInput v-model="name" label="Nombre" placeholder="Electrodomésticos" :error="nameError" required @update:model-value="autoSlug" />
        <BaseInput v-model="slug" label="Slug" placeholder="electrodomesticos" :error="slugError" required />
        <BaseSelect v-model="parentId" label="Categoría padre" :options="parentOptions" />
        <BaseInput v-model.number="sortOrder" label="Orden" type="number" placeholder="0" />
        <div>
          <p class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Imagen</p>
          <ImageUploader v-model="image" :max="1" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="router.back()">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">{{ isEdit ? 'Guardar' : 'Crear categoría' }}</BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
