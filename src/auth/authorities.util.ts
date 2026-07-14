interface UserRoleWithPermissions {
  role: {
    name: string;
    permissions: { permission: { name: string } }[];
  };
}

export function buildAuthorities(roles: UserRoleWithPermissions[]): string[] {
  const authorities = new Set<string>();
  for (const userRole of roles) {
    authorities.add(`ROLE_${userRole.role.name}`);
    for (const rolePermission of userRole.role.permissions) {
      authorities.add(rolePermission.permission.name);
    }
  }
  return [...authorities];
}

export const USER_WITH_AUTHORITIES_INCLUDE = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} as const;
