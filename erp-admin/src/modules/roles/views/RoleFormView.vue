<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from '@/shared/composables/useToast';
import { roleApi } from '../api';
import { extractApiError } from '@/shared/types/api.types';
import type { Permission } from '@/modules/auth/types';
import PageHeader from '@/shared/components/common/PageHeader.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string | undefined;
const isEdit = !!id;
const isSubmitting = ref(false);

const name = ref('');
const description = ref('');
const selectedPermissions = ref<Permission[]>([]);

const allPermissions: { group: string; items: Permission[] }[] = [
  { group: 'Empresas', items: ['company:view', 'company:create', 'company:update', 'company:delete'] },
  { group: 'Sucursales', items: ['branch:view', 'branch:create', 'branch:update', 'branch:delete'] },
  { group: 'Tiendas', items: ['store:view', 'store:create', 'store:update', 'store:delete'] },
  { group: 'Personal', items: ['user:view', 'user:create', 'user:update', 'user:delete'] },
  { group: 'Roles', items: ['role:view', 'role:create', 'role:update', 'role:delete'] },
  { group: 'Marcas', items: ['brand:view', 'brand:create', 'brand:update', 'brand:delete'] },
  { group: 'Categorías', items: ['category:view', 'category:create', 'category:update', 'category:delete'] },
  { group: 'Productos', items: ['product:view', 'product:create', 'product:update', 'product:delete'] },
  { group: 'Reportes', items: ['report:view'] },
];

onMounted(async () => {
  if (isEdit && id) {
    const role = await roleApi.getById(id);
    name.value = role.name;
    description.value = role.description ?? '';
    selectedPermissions.value = [...role.permissions];
  }
});

function togglePermission(p: Permission) {
  const idx = selectedPermissions.value.indexOf(p);
  if (idx >= 0) selectedPermissions.value.splice(idx, 1);
  else selectedPermissions.value.push(p);
}

function toggleGroup(items: Permission[]) {
  const allSelected = items.every((p) => selectedPermissions.value.includes(p));
  if (allSelected) {
    selectedPermissions.value = selectedPermissions.value.filter((p) => !items.includes(p));
  } else {
    items.forEach((p) => { if (!selectedPermissions.value.includes(p)) selectedPermissions.value.push(p); });
  }
}

async function onSubmit() {
  if (!name.value.trim()) { toast.error('El nombre es requerido'); return; }
  isSubmitting.value = true;
  try {
    const payload = { name: name.value, description: description.value || undefined, permissions: selectedPermissions.value };
    if (isEdit && id) {
      await roleApi.update(id, payload);
      toast.success('Rol actualizado');
    } else {
      await roleApi.create(payload);
      toast.success('Rol creado');
    }
    router.push('/roles');
  } catch (e) { toast.error(extractApiError(e)); }
  finally { isSubmitting.value = false; }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <PageHeader :title="isEdit ? 'Editar rol' : 'Nuevo rol'">
      <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
    </PageHeader>
    <div class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div class="space-y-4">
          <BaseInput v-model="name" label="Nombre del rol" placeholder="Ej: Gerente de Tienda" required />
          <BaseInput v-model="description" label="Descripción" placeholder="Opcional" />
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Permisos</h3>
        <div class="space-y-5">
          <div v-for="group in allPermissions" :key="group.group">
            <div class="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                :checked="group.items.every((p) => selectedPermissions.includes(p))"
                :indeterminate="group.items.some((p) => selectedPermissions.includes(p)) && !group.items.every((p) => selectedPermissions.includes(p))"
                @change="toggleGroup(group.items)"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ group.group }}</span>
            </div>
            <div class="ml-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label
                v-for="perm in group.items"
                :key="perm"
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  :checked="selectedPermissions.includes(perm)"
                  @change="togglePermission(perm)"
                />
                {{ perm.split(':')[1] }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <BaseButton variant="secondary" @click="router.back()">Cancelar</BaseButton>
        <BaseButton :loading="isSubmitting" @click="onSubmit">{{ isEdit ? 'Guardar cambios' : 'Crear rol' }}</BaseButton>
      </div>
    </div>
  </div>
</template>
