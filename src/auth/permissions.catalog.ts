export interface PermissionDefinition {
  name: string;
  description: string;
}

/**
 * Static, code-owned RBAC catalog. The `permissions` table is only a projection
 * of this list, reconciled at bootstrap. Never edit permission names/rows
 * directly in the database.
 */
export const PERMISSIONS_CATALOG: readonly PermissionDefinition[] = [
  {
    name: 'user:create',
    description: 'Allows creating new users in the system.',
  },
  {
    name: 'user:read',
    description: 'Allows viewing information of registered users.',
  },
  {
    name: 'user:update',
    description: 'Allows modifying information of existing users.',
  },
  {
    name: 'user:delete',
    description: 'Allows deleting users from the system.',
  },

  {
    name: 'role:create',
    description: 'Allows creating new roles in the system.',
  },
  {
    name: 'role:read',
    description: 'Allows viewing information of registered roles.',
  },
  {
    name: 'role:update',
    description: 'Allows modifying information of existing roles.',
  },
  {
    name: 'role:delete',
    description: 'Allows deleting roles from the system.',
  },

  {
    name: 'permission:create',
    description: 'Allows creating new permissions in the system.',
  },
  {
    name: 'permission:read',
    description: 'Allows viewing information of registered permissions.',
  },
  {
    name: 'permission:update',
    description: 'Allows modifying information of existing permissions.',
  },
  {
    name: 'permission:delete',
    description: 'Allows deleting permissions from the system.',
  },

  {
    name: 'person:create',
    description: 'Allows creating new persons in the system.',
  },
  {
    name: 'person:read',
    description: 'Allows viewing information of registered persons.',
  },
  {
    name: 'person:update',
    description: 'Allows modifying information of existing persons.',
  },
  {
    name: 'person:delete',
    description: 'Allows deleting persons from the system.',
  },

  {
    name: 'company:create',
    description: 'Allows creating new companies in the system.',
  },
  {
    name: 'company:read',
    description: 'Allows viewing information of registered companies.',
  },
  {
    name: 'company:update',
    description: 'Allows modifying information of existing companies.',
  },
  {
    name: 'company:delete',
    description: 'Allows deleting companies from the system.',
  },

  {
    name: 'vehicle:create',
    description: 'Allows creating new vehicles in the system.',
  },
  {
    name: 'vehicle:read',
    description: 'Allows viewing information of registered vehicles.',
  },
  {
    name: 'vehicle:update',
    description: 'Allows modifying information of existing vehicles.',
  },
  {
    name: 'vehicle:delete',
    description: 'Allows deleting vehicles from the system.',
  },

  {
    name: 'car:create',
    description: 'Allows creating new cars in the system.',
  },
  {
    name: 'car:read',
    description: 'Allows viewing information of registered cars.',
  },
  {
    name: 'car:update',
    description: 'Allows modifying information of existing cars.',
  },
  { name: 'car:delete', description: 'Allows deleting cars from the system.' },

  {
    name: 'motorcycle:create',
    description: 'Allows creating new motorcycles in the system.',
  },
  {
    name: 'motorcycle:read',
    description: 'Allows viewing information of registered motorcycles.',
  },
  {
    name: 'motorcycle:update',
    description: 'Allows modifying information of existing motorcycles.',
  },
  {
    name: 'motorcycle:delete',
    description: 'Allows deleting motorcycles from the system.',
  },

  {
    name: 'purchase_sale:create',
    description: 'Allows creating new purchase-sale contracts in the system.',
  },
  {
    name: 'purchase_sale:read',
    description:
      'Allows viewing information of registered purchase-sale contracts.',
  },
  {
    name: 'purchase_sale:update',
    description:
      'Allows modifying information of existing purchase-sale contracts.',
  },
  {
    name: 'purchase_sale:delete',
    description: 'Allows deleting purchase-sale contracts from the system.',
  },

  {
    name: 'ml:predict',
    description: 'Allows accessing the prediction features of the system.',
  },
  {
    name: 'ml:retrain',
    description: 'Allows accessing the training features of the system.',
  },
  {
    name: 'ml:models',
    description: 'Allows managing the system machine-learning models.',
  },
] as const;

export const PERMISSION_NAMES: readonly string[] = PERMISSIONS_CATALOG.map(
  (p) => p.name,
);

export function isKnownPermission(name: string): boolean {
  return PERMISSION_NAMES.includes(name);
}

export const ROLE_NAMES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  [ROLE_NAMES.ADMIN]: PERMISSION_NAMES,
  [ROLE_NAMES.USER]: ['user:read'],
};
