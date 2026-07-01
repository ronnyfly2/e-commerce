import { DataSource, IsNull } from 'typeorm';
import { RoleOrmEntity } from '@/modules/roles/infrastructure/persistence/role.orm-entity';
import { Permission } from '@/shared/domain/permission.enum';

interface RoleDef {
  name: string;
  description: string;
  permissions: Permission[];
}

const ROLES: RoleDef[] = [
  {
    name: 'Super Administrador ERP',
    description:
      'Control total del panel de administración. Gestiona sucursales, tiendas, usuarios, roles, catálogo, inventario, pedidos, pagos y reportes.',
    permissions: [
      // Branches
      Permission.BRANCH_VIEW, Permission.BRANCH_CREATE, Permission.BRANCH_UPDATE, Permission.BRANCH_DELETE,
      // Stores
      Permission.STORE_VIEW, Permission.STORE_CREATE, Permission.STORE_UPDATE, Permission.STORE_DELETE,
      // Users
      Permission.USER_VIEW, Permission.USER_CREATE, Permission.USER_UPDATE, Permission.USER_DELETE,
      // Roles
      Permission.ROLE_VIEW, Permission.ROLE_CREATE, Permission.ROLE_UPDATE, Permission.ROLE_DELETE,
      // Brands
      Permission.BRAND_VIEW, Permission.BRAND_CREATE, Permission.BRAND_UPDATE, Permission.BRAND_DELETE,
      // Categories
      Permission.CATEGORY_VIEW, Permission.CATEGORY_CREATE, Permission.CATEGORY_UPDATE, Permission.CATEGORY_DELETE,
      // Products
      Permission.PRODUCT_VIEW, Permission.PRODUCT_CREATE, Permission.PRODUCT_UPDATE, Permission.PRODUCT_DELETE,
      // Inventory
      Permission.INVENTORY_VIEW, Permission.INVENTORY_ADJUST,
      // Orders
      Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_UPDATE, Permission.ORDER_CANCEL, Permission.ORDER_EXPORT,
      // Payments
      Permission.PAYMENT_VIEW, Permission.PAYMENT_PROCESS, Permission.PAYMENT_REFUND,
      // Customers
      Permission.CUSTOMER_VIEW, Permission.CUSTOMER_CREATE, Permission.CUSTOMER_UPDATE, Permission.CUSTOMER_DELETE,
      // Discounts
      Permission.DISCOUNT_VIEW, Permission.DISCOUNT_MANAGE,
      // Reports
      Permission.REPORT_VIEW, Permission.REPORT_EXPORT,
      // Dashboard
      Permission.DASHBOARD_VIEW,
    ],
  },

  {
    name: 'Administrador',
    description:
      'Administra la operación diaria: crea y gestiona usuarios, catálogo, pedidos y reportes. No puede eliminar sucursales, tiendas ni gestionar monedas.',
    permissions: [
      // Branches (no delete)
      Permission.BRANCH_VIEW, Permission.BRANCH_CREATE, Permission.BRANCH_UPDATE,
      // Stores (no delete)
      Permission.STORE_VIEW, Permission.STORE_CREATE, Permission.STORE_UPDATE,
      // Users (full)
      Permission.USER_VIEW, Permission.USER_CREATE, Permission.USER_UPDATE, Permission.USER_DELETE,
      // Roles (view only — no modificar roles del sistema)
      Permission.ROLE_VIEW,
      // Brands
      Permission.BRAND_VIEW, Permission.BRAND_CREATE, Permission.BRAND_UPDATE, Permission.BRAND_DELETE,
      // Categories
      Permission.CATEGORY_VIEW, Permission.CATEGORY_CREATE, Permission.CATEGORY_UPDATE, Permission.CATEGORY_DELETE,
      // Products
      Permission.PRODUCT_VIEW, Permission.PRODUCT_CREATE, Permission.PRODUCT_UPDATE, Permission.PRODUCT_DELETE,
      // Inventory
      Permission.INVENTORY_VIEW, Permission.INVENTORY_ADJUST,
      // Orders
      Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_UPDATE, Permission.ORDER_CANCEL, Permission.ORDER_EXPORT,
      // Payments
      Permission.PAYMENT_VIEW, Permission.PAYMENT_PROCESS, Permission.PAYMENT_REFUND,
      // Customers
      Permission.CUSTOMER_VIEW, Permission.CUSTOMER_CREATE, Permission.CUSTOMER_UPDATE,
      // Discounts
      Permission.DISCOUNT_VIEW, Permission.DISCOUNT_MANAGE,
      // Reports
      Permission.REPORT_VIEW, Permission.REPORT_EXPORT,
      // Dashboard
      Permission.DASHBOARD_VIEW,
    ],
  },

  {
    name: 'Marketing',
    description:
      'Analiza ventas, gestiona campañas de descuentos y exporta reportes. Acceso de solo lectura al catálogo y clientes.',
    permissions: [
      // Catalog (read-only)
      Permission.PRODUCT_VIEW,
      Permission.CATEGORY_VIEW,
      Permission.BRAND_VIEW,
      // Orders (view + export)
      Permission.ORDER_VIEW, Permission.ORDER_EXPORT,
      // Customers (view + create)
      Permission.CUSTOMER_VIEW, Permission.CUSTOMER_CREATE, Permission.CUSTOMER_UPDATE,
      // Discounts (full)
      Permission.DISCOUNT_VIEW, Permission.DISCOUNT_MANAGE,
      // Reports
      Permission.REPORT_VIEW, Permission.REPORT_EXPORT,
      // Dashboard
      Permission.DASHBOARD_VIEW,
    ],
  },

  {
    name: 'Vendedor',
    description:
      'Crea y gestiona pedidos desde cualquier canal (admin, teléfono, WhatsApp). Puede registrar y actualizar clientes.',
    permissions: [
      // Catalog (read-only)
      Permission.PRODUCT_VIEW,
      Permission.CATEGORY_VIEW,
      Permission.BRAND_VIEW,
      // Inventory (view)
      Permission.INVENTORY_VIEW,
      // Orders (create + manage, no export)
      Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_UPDATE, Permission.ORDER_CANCEL,
      // Payments (view + process)
      Permission.PAYMENT_VIEW, Permission.PAYMENT_PROCESS,
      // Customers
      Permission.CUSTOMER_VIEW, Permission.CUSTOMER_CREATE, Permission.CUSTOMER_UPDATE,
      // Dashboard
      Permission.DASHBOARD_VIEW,
    ],
  },

  {
    name: 'Cajero',
    description:
      'Opera la caja: crea pedidos en punto de venta, procesa y reembolsa pagos. Acceso de solo lectura al inventario.',
    permissions: [
      // Catalog (read-only)
      Permission.PRODUCT_VIEW,
      // Inventory (view only)
      Permission.INVENTORY_VIEW,
      // Orders (create + update, no cancel ni export)
      Permission.ORDER_VIEW, Permission.ORDER_CREATE, Permission.ORDER_UPDATE,
      // Payments (full: cobrar y reembolsar)
      Permission.PAYMENT_VIEW, Permission.PAYMENT_PROCESS, Permission.PAYMENT_REFUND,
      // Customers (view only)
      Permission.CUSTOMER_VIEW,
      // Dashboard
      Permission.DASHBOARD_VIEW,
    ],
  },

  {
    name: 'Cliente',
    description:
      'Cuenta de cliente para el portal web. Solo puede consultar sus propios pedidos. Sin acceso al panel de administración.',
    permissions: [
      Permission.ORDER_VIEW,
    ],
  },
];

export async function seedRoles(ds: DataSource): Promise<void> {
  const repo = ds.getRepository(RoleOrmEntity);

  for (const def of ROLES) {
    const existing = await repo.findOne({
      where: { name: def.name, companyId: IsNull() },
    });

    if (existing) {
      // Update permissions in case the enum has grown
      await repo.update(existing.id, {
        description: def.description,
        permissions: def.permissions,
        isSystem: true,
      });
      console.log(`[seed] role "${def.name}" updated (${def.permissions.length} permisos)`);
    } else {
      await repo.save(
        repo.create({
          name: def.name,
          description: def.description,
          permissions: def.permissions,
          isSystem: true,
          companyId: null,
        }),
      );
      console.log(`[seed] role "${def.name}" creado (${def.permissions.length} permisos)`);
    }
  }
}
