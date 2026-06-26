import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse } from '@/shared/types/api.types';
import type { Permission } from '@/modules/auth/types';

export interface AuthUser {
  sub: string;
  email: string;
  companyId: string | null;
  permissions: Permission[];
  isSuperAdmin: boolean;
}

function parseJwtPayload(token: string): AuthUser | null {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64)) as AuthUser;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'));
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));
  const user = ref<AuthUser | null>(
    accessToken.value ? parseJwtPayload(accessToken.value) : null,
  );
  const isLoading = ref(false);

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);

  function hasPermission(permission: Permission): boolean {
    if (!user.value) return false;
    if (user.value.isSuperAdmin) return true;
    return user.value.permissions.includes(permission);
  }

  async function login(email: string, password: string): Promise<void> {
    isLoading.value = true;
    try {
      const res = await client.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        API.auth.login,
        { email, password },
      );
      const { accessToken: at, refreshToken: rt } = res.data.data;
      accessToken.value = at;
      refreshToken.value = rt;
      user.value = parseJwtPayload(at);
      localStorage.setItem('accessToken', at);
      localStorage.setItem('refreshToken', rt);
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    if (refreshToken.value) {
      await client
        .post(API.auth.logout, { refreshToken: refreshToken.value })
        .catch(() => undefined);
    }
    clearState();
  }

  function clearState(): void {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    isAuthenticated,
    hasPermission,
    login,
    logout,
    clearState,
  };
});
