<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from 'vue-sonner';
import { userApi } from '../api';
import { roleApi } from '@/modules/roles/api';
import { extractApiError } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;
const roleOptions = ref<{ label: string; value: string }[]>([]);

const baseSchema = { firstName: z.string().min(1).max(100), lastName: z.string().min(1).max(100), phone: z.string().max(20).optional(), roleId: z.string().uuid('Selecciona un rol') };
const createSchema = toTypedSchema(z.object({ ...baseSchema, email: z.string().email(), password: z.string().min(8) }));
const editSchema = toTypedSchema(z.object({ ...baseSchema, password: z.string().min(8).optional().or(z.literal('')) }));

const { handleSubmit, isSubmitting, setValues } = useForm({ validationSchema: isEdit ? editSchema : createSchema });
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: password, errorMessage: passwordError } = useField<string>('password');
const { value: firstName, errorMessage: firstNameError } = useField<string>('firstName');
const { value: lastName, errorMessage: lastNameError } = useField<string>('lastName');
const { value: phone } = useField<string>('phone');
const { value: roleId, errorMessage: roleError } = useField<string>('roleId');

onMounted(async () => {
  const roles = await roleApi.getAll({ limit: 100 });
  roleOptions.value = roles.items.map((r) => ({ label: r.name, value: r.id }));
  if (isEdit && id) {
    const u = await userApi.getById(id);
    setValues({ firstName: u.firstName, lastName: u.lastName, phone: u.phone ?? '', roleId: u.roleId ?? '' });
  }
});

const onSubmit = handleSubmit(async (values) => {
  try {
    if (isEdit && id) {
      const { email: _email, ...rest } = values as { email?: string; password?: string; firstName: string; lastName: string; phone?: string; roleId: string };
      const updatePayload = { ...rest, password: rest.password || undefined };
      await userApi.update(id, updatePayload);
      toast.success('Usuario actualizado');
    } else {
      await userApi.create(values as { email: string; password: string; firstName: string; lastName: string; phone?: string; roleId: string });
      toast.success('Usuario creado');
    }
    router.push('/users');
  } catch (e) { toast.error(extractApiError(e)); }
});
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <PageHeader :title="isEdit ? 'Editar usuario' : 'Nuevo usuario'">
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <form class="space-y-5" @submit.prevent="onSubmit">
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="firstName" label="Nombre" placeholder="John" :error="firstNameError" required />
          <BaseInput v-model="lastName" label="Apellido" placeholder="Doe" :error="lastNameError" required />
        </div>
        <BaseInput v-if="!isEdit" v-model="email" label="Email" type="email" placeholder="john@empresa.com" :error="emailError" required />
        <BaseInput v-model="password" label="Contraseña" type="password" :placeholder="isEdit ? 'Dejar vacío para no cambiar' : '••••••••'" :error="passwordError" :required="!isEdit" />
        <BaseInput v-model="phone" label="Teléfono" placeholder="+51999999999" />
        <BaseSelect v-model="roleId" label="Rol" placeholder="Selecciona un rol" :options="roleOptions" :error="roleError" required />
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="router.back()">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">{{ isEdit ? 'Guardar' : 'Crear usuario' }}</BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
