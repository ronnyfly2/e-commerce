export type Permission =
  // Companies
  | 'company:view' | 'company:create' | 'company:update' | 'company:delete'
  // Branches
  | 'branch:view' | 'branch:create' | 'branch:update' | 'branch:delete'
  // Stores
  | 'store:view' | 'store:create' | 'store:update' | 'store:delete'
  // Users
  | 'user:view' | 'user:create' | 'user:update' | 'user:delete'
  // Roles
  | 'role:view' | 'role:create' | 'role:update' | 'role:delete'
  // Brands
  | 'brand:view' | 'brand:create' | 'brand:update' | 'brand:delete'
  // Categories
  | 'category:view' | 'category:create' | 'category:update' | 'category:delete'
  // Products
  | 'product:view' | 'product:create' | 'product:update' | 'product:delete'
  // Inventory
  | 'inventory:view' | 'inventory:adjust'
  // Orders
  | 'order:view' | 'order:create' | 'order:update' | 'order:cancel' | 'order:export'
  // Payments
  | 'payment:view' | 'payment:process' | 'payment:refund'
  // Customers
  | 'customer:view' | 'customer:create' | 'customer:update' | 'customer:delete'
  // Deals
  | 'deal:view' | 'deal:create' | 'deal:update' | 'deal:delete'
  // Discounts
  | 'discount:view' | 'discount:manage'
  // Reports
  | 'report:view' | 'report:export'
  // Dashboard
  | 'dashboard:view'
  // Currencies
  | 'currency:view' | 'currency:create' | 'currency:update'
  // Loyalty points
  | 'points:view' | 'points:manage'
  // Raffles
  | 'raffle:view' | 'raffle:manage';

export interface PermissionGroup {
  label: string;
  permissions: { value: Permission; label: string }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'Sucursales',
    permissions: [
      { value: 'branch:view', label: 'Ver' },
      { value: 'branch:create', label: 'Crear' },
      { value: 'branch:update', label: 'Editar' },
      { value: 'branch:delete', label: 'Eliminar' },
    ],
  },
  {
    label: 'Tiendas',
    permissions: [
      { value: 'store:view', label: 'Ver' },
      { value: 'store:create', label: 'Crear' },
      { value: 'store:update', label: 'Editar' },
      { value: 'store:delete', label: 'Eliminar' },
    ],
  },
  {
    label: 'Usuarios',
    permissions: [
      { value: 'user:view', label: 'Ver' },
      { value: 'user:create', label: 'Crear' },
      { value: 'user:update', label: 'Editar' },
      { value: 'user:delete', label: 'Eliminar' },
    ],
  },
  {
    label: 'Roles',
    permissions: [
      { value: 'role:view', label: 'Ver' },
      { value: 'role:create', label: 'Crear' },
      { value: 'role:update', label: 'Editar' },
      { value: 'role:delete', label: 'Eliminar' },
    ],
  },
  {
    label: 'Marcas',
    permissions: [
      { value: 'brand:view', label: 'Ver' },
      { value: 'brand:create', label: 'Crear' },
      { value: 'brand:update', label: 'Editar' },
      { value: 'brand:delete', label: 'Eliminar' },
    ],
  },
  {
    label: 'Categorías',
    permissions: [
      { value: 'category:view', label: 'Ver' },
      { value: 'category:create', label: 'Crear' },
      { value: 'category:update', label: 'Editar' },
      { value: 'category:delete', label: 'Eliminar' },
    ],
  },
  {
    label: 'Productos',
    permissions: [
      { value: 'product:view', label: 'Ver' },
      { value: 'product:create', label: 'Crear' },
      { value: 'product:update', label: 'Editar' },
      { value: 'product:delete', label: 'Eliminar' },
    ],
  },
  {
    label: 'Inventario',
    permissions: [
      { value: 'inventory:view', label: 'Ver stock' },
      { value: 'inventory:adjust', label: 'Ajustar stock' },
    ],
  },
  {
    label: 'Pedidos',
    permissions: [
      { value: 'order:view', label: 'Ver' },
      { value: 'order:create', label: 'Crear' },
      { value: 'order:update', label: 'Actualizar' },
      { value: 'order:cancel', label: 'Cancelar' },
      { value: 'order:export', label: 'Exportar' },
    ],
  },
  {
    label: 'Pagos',
    permissions: [
      { value: 'payment:view', label: 'Ver' },
      { value: 'payment:process', label: 'Procesar' },
      { value: 'payment:refund', label: 'Reembolsar' },
    ],
  },
  {
    label: 'Clientes',
    permissions: [
      { value: 'customer:view', label: 'Ver' },
      { value: 'customer:create', label: 'Crear' },
      { value: 'customer:update', label: 'Editar' },
      { value: 'customer:delete', label: 'Eliminar' },
    ],
  },
  {
    label: 'Pipeline (Deals)',
    permissions: [
      { value: 'deal:view', label: 'Ver' },
      { value: 'deal:create', label: 'Crear' },
      { value: 'deal:update', label: 'Editar' },
      { value: 'deal:delete', label: 'Eliminar' },
    ],
  },
  {
    label: 'Descuentos',
    permissions: [
      { value: 'discount:view', label: 'Ver' },
      { value: 'discount:manage', label: 'Gestionar' },
    ],
  },
  {
    label: 'Reportes',
    permissions: [
      { value: 'report:view', label: 'Ver' },
      { value: 'report:export', label: 'Exportar' },
    ],
  },
  {
    label: 'Dashboard',
    permissions: [
      { value: 'dashboard:view', label: 'Ver dashboard' },
    ],
  },
  {
    label: 'Puntos de fidelidad',
    permissions: [
      { value: 'points:view', label: 'Ver' },
      { value: 'points:manage', label: 'Ajustar' },
    ],
  },
  {
    label: 'Sorteos',
    permissions: [
      { value: 'raffle:view', label: 'Ver' },
      { value: 'raffle:manage', label: 'Gestionar' },
    ],
  },
];
