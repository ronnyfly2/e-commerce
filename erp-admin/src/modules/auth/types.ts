export type Permission =
  | 'company:view' | 'company:create' | 'company:update' | 'company:delete'
  | 'branch:view' | 'branch:create' | 'branch:update' | 'branch:delete'
  | 'store:view' | 'store:create' | 'store:update' | 'store:delete'
  | 'user:view' | 'user:create' | 'user:update' | 'user:delete'
  | 'role:view' | 'role:create' | 'role:update' | 'role:delete'
  | 'brand:view' | 'brand:create' | 'brand:update' | 'brand:delete'
  | 'category:view' | 'category:create' | 'category:update' | 'category:delete'
  | 'product:view' | 'product:create' | 'product:update' | 'product:delete'
  | 'report:view';
