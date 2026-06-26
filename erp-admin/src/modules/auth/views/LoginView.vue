<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from 'vue-sonner';
import { CubeIcon } from '@heroicons/vue/24/outline';
import { useAuthStore } from '@/shared/stores/auth.store';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import { extractApiError } from '@/shared/types/api.types';

const schema = toTypedSchema(
  z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
  }),
);

const { handleSubmit, isSubmitting } = useForm({ validationSchema: schema });
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: password, errorMessage: passwordError } = useField<string>('password');

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const onSubmit = handleSubmit(async (values) => {
  try {
    await auth.login(values.email, values.password);
    const redirect = (route.query.redirect as string) ?? '/dashboard';
    await router.push(redirect);
    toast.success('Bienvenido al ERP');
  } catch (err) {
    toast.error(extractApiError(err));
  }
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="mb-8 flex flex-col items-center gap-2 text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg">
          <CubeIcon class="h-7 w-7" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">ERP Admin</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Ingresa tus credenciales para continuar</p>
      </div>

      <!-- Card -->
      <div class="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <form class="space-y-5" @submit.prevent="onSubmit">
          <BaseInput
            v-model="email"
            label="Email"
            type="email"
            placeholder="tu@empresa.com"
            :error="emailError"
            required
          />

          <BaseInput
            v-model="password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            :error="passwordError"
            required
          />

          <BaseButton
            type="submit"
            class="w-full"
            :loading="isSubmitting"
          >
            Ingresar
          </BaseButton>
        </form>
      </div>
    </div>
  </div>
</template>
