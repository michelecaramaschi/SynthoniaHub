import { Role } from '@prisma/client';

type Permission =
  | 'view_dashboard'
  | 'view_requests'
  | 'manage_requests'
  | 'view_financial'
  | 'manage_financial'
  | 'view_checklists'
  | 'manage_checklists'
  | 'manage_users'
  | 'view_logs';

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    'view_dashboard',
    'view_requests',
    'manage_requests',
    'view_financial',
    'manage_financial',
    'view_checklists',
    'manage_checklists',
    'manage_users',
    'view_logs',
  ],
  MANAGER: [
    'view_dashboard',
    'view_requests',
    'manage_requests',
    'view_financial',
    'view_checklists',
    'manage_checklists',
  ],
  STAFF: [
    'view_requests',
    'view_checklists',
    'manage_checklists',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}
