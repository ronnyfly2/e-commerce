export enum Permission {
  // ─── Companies (platform super-admin only) ────────────────────────────────
  COMPANY_VIEW = 'company:view',
  COMPANY_CREATE = 'company:create',
  COMPANY_UPDATE = 'company:update',
  COMPANY_DELETE = 'company:delete',

  // ─── Branches ─────────────────────────────────────────────────────────────
  BRANCH_VIEW = 'branch:view',
  BRANCH_CREATE = 'branch:create',
  BRANCH_UPDATE = 'branch:update',
  BRANCH_DELETE = 'branch:delete',

  // ─── Stores ───────────────────────────────────────────────────────────────
  STORE_VIEW = 'store:view',
  STORE_CREATE = 'store:create',
  STORE_UPDATE = 'store:update',
  STORE_DELETE = 'store:delete',

  // ─── Users / Staff ────────────────────────────────────────────────────────
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // ─── Roles ────────────────────────────────────────────────────────────────
  ROLE_VIEW = 'role:view',
  ROLE_CREATE = 'role:create',
  ROLE_UPDATE = 'role:update',
  ROLE_DELETE = 'role:delete',

  // ─── Brands ───────────────────────────────────────────────────────────────
  BRAND_VIEW = 'brand:view',
  BRAND_CREATE = 'brand:create',
  BRAND_UPDATE = 'brand:update',
  BRAND_DELETE = 'brand:delete',

  // ─── Categories ───────────────────────────────────────────────────────────
  CATEGORY_VIEW = 'category:view',
  CATEGORY_CREATE = 'category:create',
  CATEGORY_UPDATE = 'category:update',
  CATEGORY_DELETE = 'category:delete',

  // ─── Products ─────────────────────────────────────────────────────────────
  PRODUCT_VIEW = 'product:view',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',

  // ─── Inventory ────────────────────────────────────────────────────────────
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_ADJUST = 'inventory:adjust',

  // ─── Orders ───────────────────────────────────────────────────────────────
  ORDER_VIEW = 'order:view',
  ORDER_CREATE = 'order:create',
  ORDER_UPDATE = 'order:update',
  ORDER_CANCEL = 'order:cancel',
  ORDER_EXPORT = 'order:export',

  // ─── Payments ─────────────────────────────────────────────────────────────
  PAYMENT_VIEW = 'payment:view',
  PAYMENT_PROCESS = 'payment:process',
  PAYMENT_REFUND = 'payment:refund',

  // ─── Customers ────────────────────────────────────────────────────────────
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',

  // ─── Discounts / Coupons ──────────────────────────────────────────────────
  DISCOUNT_VIEW = 'discount:view',
  DISCOUNT_MANAGE = 'discount:manage',

  // ─── Deals (CRM sales pipeline) ─────────────────────────────────────────────
  DEAL_VIEW = 'deal:view',
  DEAL_CREATE = 'deal:create',
  DEAL_UPDATE = 'deal:update',
  DEAL_DELETE = 'deal:delete',

  // ─── Reports ──────────────────────────────────────────────────────────────
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',

  // ─── Dashboard ────────────────────────────────────────────────────────────
  DASHBOARD_VIEW = 'dashboard:view',

  // ─── Currencies (platform super-admin only) ───────────────────────────────
  CURRENCY_VIEW = 'currency:view',
  CURRENCY_CREATE = 'currency:create',
  CURRENCY_UPDATE = 'currency:update',
}
