import type { Request } from 'express';
import type { Feature, TenantRole } from '@platform/shared';

/** The signed-in employee, attached to the request by the auth middleware. */
export interface AuthUser {
  id: string;
  tenantId: string;
  role: TenantRole;
  teamId: string | null;
  /** Modules enabled by the tenant's plan. */
  features: Feature[];
}

export type RequestWithUser = Request & { authUser?: AuthUser };
