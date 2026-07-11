<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from '@/shared/composables/useToast';
import { raffleApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import ImageUploader from '@/shared/components/common/ImageUploader.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;

const images = ref<string[]>([]);

const schema = toTypedSchema(
  z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    prizeDescription: z.string().min(1).max(500),
    startsAt: z.string().min(1, 'Selecciona una fecha de inicio'),
    endsAt: z.string().min(1, 'Selecciona una fecha de fin'),
    costPoints: z.coerce.number().int().min(0),
    drawAnimationSeconds: z.coerce.number().int().min(2).max(30),
  }).refine(
    (data) => !data.startsAt || !data.endsAt || new Date(data.endsAt) > new Date(data.startsAt),
    { message: 'La fecha de fin debe ser posterior a la fecha de inicio', path: ['endsAt'] },
  ),
);

// Defaults go through initialValues (not setValues) — setValues validates the whole form immediately,
// which would show "required" errors on name/prizeDescription/dates before the user has touched anything.
const { handleSubmit, isSubmitting, setValues } = useForm({
  validationSchema: schema,
  initialValues: { costPoints: 0, drawAnimationSeconds: 6 },
});
const { value: name, errorMessage: nameError } = useField<string>('name');
const { value: description } = useField<string>('description');
const { value: prizeDescription, errorMessage: prizeError } = useField<string>('prizeDescription');
const { value: startsAt, errorMessage: startsAtError } = useField<string>('startsAt');
const { value: endsAt, errorMessage: endsAtError } = useField<string>('endsAt');
const { value: costPoints, errorMessage: costPointsError } = useField<number>('costPoints');
const { value: drawAnimationSeconds, errorMessage: drawAnimationSecondsError } = useField<number>('drawAnimationSeconds');

/** <input type="datetime-local"> works with "YYYY-MM-DDTHH:mm", ISO strings need trimming to that shape. */
function toLocalInput(iso: string): string {
  return iso.slice(0, 16);
}

onMounted(async () => {
  if (isEdit && id) {
    const r = await raffleApi.getById(id);
    images.value = [...(r.images ?? [])];
    setValues({
      name: r.name,
      description: r.description ?? '',
      prizeDescription: r.prizeDescription,
      startsAt: toLocalInput(r.startsAt),
      endsAt: toLocalInput(r.endsAt),
      costPoints: r.costPoints,
      drawAnimationSeconds: r.drawAnimationSeconds,
    });
  }
});

const onSubmit = handleSubmit(async (values) => {
  try {
    const payload = {
      ...values,
      description: values.description || undefined,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
      images: images.value,
    };
    if (isEdit && id) {
      await raffleApi.update(id, payload);
      toast.success('Sorteo actualizado');
      router.push(`/raffles/${id}`);
    } else {
      const created = await raffleApi.create(payload);
      toast.success('Sorteo creado');
      router.push(`/raffles/${created.id}`);
    }
  } catch (e) {
    toast.error(extractApiError(e));
  }
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader :title="isEdit ? 'Editar sorteo' : 'Nuevo sorteo'">
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <form class="space-y-5" @submit.prevent="onSubmit">
        <BaseInput v-model="name" label="Nombre" placeholder="Sorteo Día del Cliente" :error="nameError" required />
        <BaseInput v-model="prizeDescription" label="Premio" placeholder='Una laptop 14"' :error="prizeError" required />
        <BaseInput v-model="description" label="Descripción" placeholder="Detalles adicionales (opcional)" />
        <div>
          <p class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Imágenes del premio</p>
          <ImageUploader v-model="images" prevent-duplicates />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="startsAt" label="Inicio" type="datetime-local" :error="startsAtError" required />
          <BaseInput v-model="endsAt" label="Fin" type="datetime-local" :error="endsAtError" required />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <BaseInput
            v-model.number="costPoints"
            label="Costo de entrada (puntos)"
            type="number"
            step="1"
            placeholder="0"
            :error="costPointsError"
            hint="0 = gratis. Si es mayor a 0, solo entran clientes con al menos esos puntos y se les descuentan al sortear"
          />
          <BaseInput
            v-model.number="drawAnimationSeconds"
            label="Duración de la animación (segundos)"
            type="number"
            step="1"
            placeholder="6"
            :error="drawAnimationSecondsError"
            hint="Entre 2 y 30 segundos, se usa al momento de sortear"
          />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="router.back()">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">{{ isEdit ? 'Guardar' : 'Crear sorteo' }}</BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
