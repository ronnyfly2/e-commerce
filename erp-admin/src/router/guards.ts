import type { Router } from 'vue-router';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { Permission } from '@/modules/auth/types';

export function setupGuards(router: Router): void {
  router.beforeEach((to) => {
    const auth = useAuthStore();

    if (to.meta.public) return true;

    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    const requiredPermissions = to.meta.permissions as Permission[] | undefined;
    if (requiredPermissions?.length) {
      const hasAll = requiredPermissions.every((p) => auth.hasPermission(p));
      if (!hasAll) return { name: 'forbidden' };
    }

    return true;
  });
}
