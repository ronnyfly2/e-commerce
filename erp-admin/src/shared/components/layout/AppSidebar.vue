<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import {
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  GiftIcon,
  HomeIcon,
  ShoppingBagIcon,
  TagIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  MapPinIcon,
  StarIcon,
} from '@heroicons/vue/24/outline';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useUiStore } from '@/shared/stores/ui.store';

const route = useRoute();
const auth = useAuthStore();
const ui = useUiStore();

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: HomeIcon },
  { label: 'Empresas', to: '/companies', icon: BuildingOffice2Icon, permission: 'company:view' as const },
  { label: 'Sucursales', to: '/branches', icon: MapPinIcon, permission: 'branch:view' as const },
  { label: 'Tiendas', to: '/stores', icon: BuildingStorefrontIcon, permission: 'store:view' as const },
  { label: 'Usuarios', to: '/users', icon: UsersIcon, permission: 'user:view' as const },
  { label: 'Roles', to: '/roles', icon: WrenchScrewdriverIcon, permission: 'role:view' as const },
  { label: 'Marcas', to: '/brands', icon: StarIcon, permission: 'brand:view' as const },
  { label: 'Categorías', to: '/categories', icon: TagIcon, permission: 'category:view' as const },
  { label: 'Productos', to: '/products', icon: ShoppingBagIcon, permission: 'product:view' as const },
  { label: 'Paquetes', to: '/bundles', icon: GiftIcon, permission: 'product:view' as const },
  { label: 'Monedas', to: '/currencies', icon: CurrencyDollarIcon, permission: 'currency:view' as const },
  { label: 'Pedidos', to: '/orders', icon: ClipboardDocumentListIcon, permission: 'order:view' as const },
  { label: 'Clientes', to: '/customers', icon: UserGroupIcon, permission: 'customer:view' as const },
  { label: 'Pipeline', to: '/deals', icon: FunnelIcon, permission: 'deal:view' as const },
  { label: 'WhatsApp', to: '/whatsapp/rules', icon: ChatBubbleLeftRightIcon, permission: 'customer:update' as const },
];

const visible = navItems.filter((item) =>
  !item.permission || auth.hasPermission(item.permission),
);

function isActive(path: string): boolean {
  return route.path.startsWith(path);
}
</script>

<template>
  <aside
    class="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 transition-all"
    :class="{ '-translate-x-full': !ui.sidebarOpen }"
  >
    <!-- Logo -->
    <div class="flex h-16 items-center gap-2 px-6 border-b border-gray-200 dark:border-gray-800">
      <CubeIcon class="h-7 w-7 text-primary-600" />
      <span class="text-lg font-semibold text-gray-900 dark:text-white">ERP Admin</span>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      <RouterLink
        v-for="item in visible"
        :key="item.to"
        :to="item.to"
        class="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="
          isActive(item.to)
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
        "
      >
        <component :is="item.icon" class="h-5 w-5 shrink-0" />
        {{ item.label }}
      </RouterLink>
    </nav>

    <!-- User info -->
    <div class="border-t border-gray-200 dark:border-gray-800 p-4">
      <div v-if="auth.user?.isSuperAdmin" class="mb-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        Super Admin
      </div>
      <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ auth.user?.email }}</p>
    </div>
  </aside>
</template>
