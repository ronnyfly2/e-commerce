<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { toast } from '@/shared/composables/useToast';
import { userApi } from '../api';
import { roleApi } from '@/modules/roles/api';
import type { Role } from '@/modules/roles/types';
import type { Permission, PermissionGroup } from '@/modules/auth/types';
import { PERMISSION_GROUPS } from '@/modules/auth/types';
import { extractApiErrorList } from '@/shared/types/api.types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseSelect from '@/shared/components/ui/BaseSelect.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import { ShieldCheckIcon, PlusCircleIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;

const roles = ref<Role[]>([]);
const additionalPermissions = ref<Permission[]>([]);
const showPermissions = ref(false);

const roleOptions = computed(() =>
  roles.value.map((r) => ({ label: r.name, value: r.id })),
);

const baseSchema = {
  firstName: z.string().min(1, 'Requerido').max(100),
  lastName: z.string().min(1, 'Requerido').max(100),
  phone: z.string().max(20).optional(),
  roleId: z.string().uuid('Selecciona un rol'),
};
const createSchema = toTypedSchema(
  z.object({ ...baseSchema, email: z.string().email('Email inválido'), password: z.string().min(8, 'Mínimo 8 caracteres') }),
);
const editSchema = toTypedSchema(
  z.object({ ...baseSchema, password: z.string().min(8).optional().or(z.literal('')) }),
);

const { handleSubmit, isSubmitting, setValues } = useForm({
  validationSchema: isEdit ? editSchema : createSchema,
});
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: password, errorMessage: passwordError } = useField<string>('password');
const { value: firstName, errorMessage: firstNameError } = useField<string>('firstName');
const { value: lastName, errorMessage: lastNameError } = useField<string>('lastName');
const { value: phone } = useField<string>('phone');
const { value: roleId, errorMessage: roleError } = useField<string>('roleId');

const selectedRole = computed<Role | undefined>(
  () => roles.value.find((r) => r.id === roleId.value),
);

const rolePermissionSet = computed(
  () => new Set<Permission>(selectedRole.value?.permissions ?? []),
);

const effectivePermissions = computed(
  () => new Set<Permission>([...rolePermissionSet.value, ...additionalPermissions.value]),
);

const rolePermissionCount = computed(() => rolePermissionSet.value.size);
const extraPermissionCount = computed(() => additionalPermissions.value.length);

function isFromRole(p: Permission): boolean {
  return rolePermissionSet.value.has(p);
}

function isExtra(p: Permission): boolean {
  return !rolePermissionSet.value.has(p) && additionalPermissions.value.includes(p);
}

function toggleExtra(p: Permission) {
  if (isFromRole(p)) return; // role permissions are not removable here
  const idx = additionalPermissions.value.indexOf(p);
  if (idx >= 0) {
    additionalPermissions.value.splice(idx, 1);
  } else {
    additionalPermissions.value.push(p);
  }
}

function selectAllInGroup(group: PermissionGroup) {
  for (const { value: p } of group.permissions) {
    if (!isFromRole(p) && !additionalPermissions.value.includes(p)) {
      additionalPermissions.value.push(p);
    }
  }
}

function clearExtraInGroup(group: PermissionGroup) {
  const groupSet = new Set(group.permissions.map((p) => p.value));
  additionalPermissions.value = additionalPermissions.value.filter(
    (p) => !groupSet.has(p),
  );
}

function clearAllExtra() {
  additionalPermissions.value = [];
}

onMounted(async () => {
  const result = await roleApi.getAll({ limit: 100 });
  roles.value = result.items;

  if (isEdit && id) {
    const u = await userApi.getById(id);
    setValues({
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone ?? '',
      roleId: u.roleId ?? '',
    });
    additionalPermissions.value = u.additionalPermissions ?? [];
  }
});

const onSubmit = handleSubmit(async (values) => {
  try {
    const extra = additionalPermissions.value.length > 0
      ? additionalPermissions.value
      : undefined;

    if (isEdit && id) {
      const { email: _email, ...rest } = values as {
        email?: string; password?: string; firstName: string;
        lastName: string; phone?: string; roleId: string;
      };
      await userApi.update(id, {
        ...rest,
        password: rest.password || undefined,
        additionalPermissions: extra,
      });
      toast.success('Usuario actualizado');
    } else {
      await userApi.create({
        ...(values as { email: string; password: string; firstName: string; lastName: string; phone?: string; roleId: string }),
        additionalPermissions: extra,
      });
      toast.success('Usuario creado');
    }
    router.push('/users');
  } catch (e) {
    toast.errors(extractApiErrorList(e));
  }
});
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <PageHeader :title="isEdit ? 'Editar usuario' : 'Nuevo usuario'">
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>

    <form class="space-y-6" @submit.prevent="onSubmit">
      <!-- Datos básicos -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Datos del usuario
        </h2>
        <div class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model="firstName" label="Nombre" placeholder="John" :error="firstNameError" required />
            <BaseInput v-model="lastName" label="Apellido" placeholder="Doe" :error="lastNameError" required />
          </div>
          <BaseInput
            v-if="!isEdit"
            v-model="email"
            label="Email"
            type="email"
            placeholder="john@empresa.com"
            :error="emailError"
            required
          />
          <BaseInput
            v-model="password"
            label="Contraseña"
            type="password"
            :placeholder="isEdit ? 'Dejar vacío para no cambiar' : '••••••••'"
            :error="passwordError"
            :required="!isEdit"
          />
          <BaseInput v-model="phone" label="Teléfono" placeholder="+51999999999" />
        </div>
      </div>

      <!-- Rol -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Rol
        </h2>
        <BaseSelect
          v-model="roleId"
          label="Rol asignado"
          placeholder="Selecciona un rol"
          :options="roleOptions"
          :error="roleError"
          required
        />

        <!-- Role description + permissions summary -->
        <transition name="fade">
          <div v-if="selectedRole" class="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <div class="flex items-start gap-3">
              <ShieldCheckIcon class="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {{ selectedRole.name }}
                </p>
                <p v-if="selectedRole.description" class="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
                  {{ selectedRole.description }}
                </p>
                <p class="mt-2 text-xs text-blue-700 dark:text-blue-300">
                  <strong>{{ rolePermissionCount }}</strong> permisos otorgados por este rol
                  <span v-if="extraPermissionCount > 0" class="ml-1">
                    · <strong>{{ extraPermissionCount }}</strong> adicionales
                  </span>
                </p>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Permisos -->
      <div v-if="selectedRole" class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <!-- Header accordion -->
        <button
          type="button"
          class="flex w-full items-center justify-between px-6 py-4 text-left"
          @click="showPermissions = !showPermissions"
        >
          <div class="flex items-center gap-2">
            <PlusCircleIcon class="h-5 w-5 text-gray-400" />
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Permisos efectivos
            </span>
            <span class="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {{ effectivePermissions.size }} activos
            </span>
          </div>
          <svg
            class="h-5 w-5 text-gray-400 transition-transform duration-200"
            :class="showPermissions ? 'rotate-180' : ''"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </button>

        <transition name="slide">
          <div v-if="showPermissions" class="border-t border-gray-100 dark:border-gray-800">
            <!-- Legend -->
            <div class="flex flex-wrap items-center gap-4 border-b border-gray-100 px-6 py-3 dark:border-gray-800">
              <span class="flex items-center gap-1.5 text-xs text-gray-500">
                <span class="h-3 w-3 rounded-sm bg-emerald-500"></span>
                Del rol (no modificable)
              </span>
              <span class="flex items-center gap-1.5 text-xs text-gray-500">
                <span class="h-3 w-3 rounded-sm bg-blue-500"></span>
                Permiso adicional
              </span>
              <span class="flex items-center gap-1.5 text-xs text-gray-500">
                <span class="h-3 w-3 rounded-sm border border-gray-300 bg-white dark:bg-gray-800"></span>
                Sin permiso
              </span>
              <button
                v-if="extraPermissionCount > 0"
                type="button"
                class="ml-auto text-xs text-red-500 underline hover:text-red-700"
                @click="clearAllExtra"
              >
                Limpiar adicionales
              </button>
            </div>

            <!-- Permission groups -->
            <div class="divide-y divide-gray-50 dark:divide-gray-800/60">
              <div v-for="group in PERMISSION_GROUPS" :key="group.label" class="px-6 py-4">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {{ group.label }}
                  </span>
                  <div class="flex gap-3">
                    <button
                      type="button"
                      class="text-xs text-blue-500 hover:text-blue-700"
                      @click="selectAllInGroup(group)"
                    >
                      Todo
                    </button>
                    <button
                      type="button"
                      class="text-xs text-gray-400 hover:text-gray-600"
                      @click="clearExtraInGroup(group)"
                    >
                      Quitar extras
                    </button>
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <label
                    v-for="{ value: perm, label: permLabel } in group.permissions"
                    :key="perm"
                    :class="[
                      'flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isFromRole(perm)
                        ? 'cursor-default bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800'
                        : isExtra(perm)
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800'
                          : 'bg-gray-50 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700',
                    ]"
                    @click="!isFromRole(perm) && toggleExtra(perm)"
                  >
                    <input
                      type="checkbox"
                      class="sr-only"
                      :checked="effectivePermissions.has(perm)"
                      :disabled="isFromRole(perm)"
                      @change="toggleExtra(perm)"
                    />
                    <!-- checkmark icon -->
                    <svg
                      v-if="effectivePermissions.has(perm)"
                      class="h-3 w-3 shrink-0"
                      viewBox="0 0 12 12"
                      fill="currentColor"
                    >
                      <path d="M10.28 1.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 1.28z" />
                    </svg>
                    <svg
                      v-else
                      class="h-3 w-3 flex-shrink-0 text-gray-300"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                    >
                      <rect x="0.5" y="0.5" width="11" height="11" rx="1.5" stroke-width="1" />
                    </svg>
                    {{ permLabel }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 pb-8">
        <BaseButton variant="secondary" type="button" @click="router.back()">Cancelar</BaseButton>
        <BaseButton type="submit" :loading="isSubmitting">
          {{ isEdit ? 'Guardar cambios' : 'Crear usuario' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
.slide-enter-to,
.slide-leave-from {
  max-height: 1500px;
  opacity: 1;
}
</style>
