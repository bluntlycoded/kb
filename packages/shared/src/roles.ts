/**
 * Roles inside a customer company (tenant).
 * Hierarchy: EMPLOYEE < MANAGER < HR < COMPANY_ADMIN.
 */
export const TENANT_ROLES = ['EMPLOYEE', 'MANAGER', 'HR', 'COMPANY_ADMIN'] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

/**
 * Roles that sit above all tenants.
 * CORE_ADMIN: us (the developer company).
 * RESELLER_ADMIN: our client, who sells the product to customer companies.
 */
export const PLATFORM_ROLES = ['CORE_ADMIN', 'RESELLER_ADMIN'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

const ALL: readonly TenantRole[] = TENANT_ROLES;
const MANAGER_UP: readonly TenantRole[] = ['MANAGER', 'HR', 'COMPANY_ADMIN'];
const HR_UP: readonly TenantRole[] = ['HR', 'COMPANY_ADMIN'];
const ADMIN_ONLY: readonly TenantRole[] = ['COMPANY_ADMIN'];

export const PERMISSIONS = {
  'portal.use': ALL,
  'praise.give': ALL,
  'chat.use': ALL,
  'games.play': ALL,
  'profile.read.team': MANAGER_UP,
  'profile.read.all': HR_UP,
  'teams.manage': HR_UP,
  'quizzes.manage': HR_UP,
  'cohorts.manage': HR_UP,
  'announcements.post': HR_UP,
  'assessments.review': HR_UP,
  'points.adjust': HR_UP,
  'analytics.read': HR_UP,
  'tenant.settings': ADMIN_ONLY,
  'audit.read': ADMIN_ONLY,
} as const satisfies Record<string, readonly TenantRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: TenantRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly TenantRole[]).includes(role);
}
