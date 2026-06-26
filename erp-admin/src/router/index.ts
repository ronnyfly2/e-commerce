import { createRouter, createWebHistory } from 'vue-router';
import { setupGuards } from './guards';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/auth/views/LoginView.vue'),
      meta: { public: true },
    },

    {
      path: '/',
      component: () => import('@/shared/components/layout/AppLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/modules/dashboard/views/DashboardView.vue'),
        },

        // ─── Companies ───────────────────────────────────────────────────────
        {
          path: 'companies',
          name: 'companies',
          component: () => import('@/modules/companies/views/CompanyListView.vue'),
          meta: { permissions: ['company:view'] },
        },
        {
          path: 'companies/new',
          name: 'companies.create',
          component: () => import('@/modules/companies/views/CompanyFormView.vue'),
          meta: { permissions: ['company:create'] },
        },
        {
          path: 'companies/:id/edit',
          name: 'companies.edit',
          component: () => import('@/modules/companies/views/CompanyFormView.vue'),
          meta: { permissions: ['company:update'] },
        },

        // ─── Branches ────────────────────────────────────────────────────────
        {
          path: 'branches',
          name: 'branches',
          component: () => import('@/modules/branches/views/BranchListView.vue'),
          meta: { permissions: ['branch:view'] },
        },
        {
          path: 'branches/new',
          name: 'branches.create',
          component: () => import('@/modules/branches/views/BranchFormView.vue'),
          meta: { permissions: ['branch:create'] },
        },
        {
          path: 'branches/:id/edit',
          name: 'branches.edit',
          component: () => import('@/modules/branches/views/BranchFormView.vue'),
          meta: { permissions: ['branch:update'] },
        },

        // ─── Stores ──────────────────────────────────────────────────────────
        {
          path: 'stores',
          name: 'stores',
          component: () => import('@/modules/stores/views/StoreListView.vue'),
          meta: { permissions: ['store:view'] },
        },
        {
          path: 'stores/new',
          name: 'stores.create',
          component: () => import('@/modules/stores/views/StoreFormView.vue'),
          meta: { permissions: ['store:create'] },
        },
        {
          path: 'stores/:id/edit',
          name: 'stores.edit',
          component: () => import('@/modules/stores/views/StoreFormView.vue'),
          meta: { permissions: ['store:update'] },
        },

        // ─── Users ───────────────────────────────────────────────────────────
        {
          path: 'users',
          name: 'users',
          component: () => import('@/modules/users/views/UserListView.vue'),
          meta: { permissions: ['user:view'] },
        },
        {
          path: 'users/new',
          name: 'users.create',
          component: () => import('@/modules/users/views/UserFormView.vue'),
          meta: { permissions: ['user:create'] },
        },
        {
          path: 'users/:id/edit',
          name: 'users.edit',
          component: () => import('@/modules/users/views/UserFormView.vue'),
          meta: { permissions: ['user:update'] },
        },

        // ─── Roles ───────────────────────────────────────────────────────────
        {
          path: 'roles',
          name: 'roles',
          component: () => import('@/modules/roles/views/RoleListView.vue'),
          meta: { permissions: ['role:view'] },
        },
        {
          path: 'roles/new',
          name: 'roles.create',
          component: () => import('@/modules/roles/views/RoleFormView.vue'),
          meta: { permissions: ['role:create'] },
        },
        {
          path: 'roles/:id/edit',
          name: 'roles.edit',
          component: () => import('@/modules/roles/views/RoleFormView.vue'),
          meta: { permissions: ['role:update'] },
        },

        // ─── Catalog ─────────────────────────────────────────────────────────
        {
          path: 'brands',
          name: 'brands',
          component: () => import('@/modules/brands/views/BrandListView.vue'),
          meta: { permissions: ['brand:view'] },
        },
        {
          path: 'brands/new',
          name: 'brands.create',
          component: () => import('@/modules/brands/views/BrandFormView.vue'),
          meta: { permissions: ['brand:create'] },
        },
        {
          path: 'brands/:id/edit',
          name: 'brands.edit',
          component: () => import('@/modules/brands/views/BrandFormView.vue'),
          meta: { permissions: ['brand:update'] },
        },
        {
          path: 'categories',
          name: 'categories',
          component: () => import('@/modules/categories/views/CategoryListView.vue'),
          meta: { permissions: ['category:view'] },
        },
        {
          path: 'categories/new',
          name: 'categories.create',
          component: () => import('@/modules/categories/views/CategoryFormView.vue'),
          meta: { permissions: ['category:create'] },
        },
        {
          path: 'categories/:id/edit',
          name: 'categories.edit',
          component: () => import('@/modules/categories/views/CategoryFormView.vue'),
          meta: { permissions: ['category:update'] },
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('@/modules/products/views/ProductListView.vue'),
          meta: { permissions: ['product:view'] },
        },
        {
          path: 'products/new',
          name: 'products.create',
          component: () => import('@/modules/products/views/ProductFormView.vue'),
          meta: { permissions: ['product:create'] },
        },
        {
          path: 'products/:id/edit',
          name: 'products.edit',
          component: () => import('@/modules/products/views/ProductFormView.vue'),
          meta: { permissions: ['product:update'] },
        },
      ],
    },

    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/shared/views/ForbiddenView.vue'),
      meta: { public: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/shared/views/NotFoundView.vue'),
      meta: { public: true },
    },
  ],
});

setupGuards(router);

export default router;
