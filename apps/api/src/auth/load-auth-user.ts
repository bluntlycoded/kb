import type { Feature } from '@platform/shared';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from './auth-user.js';

export async function loadAuthUser(prisma: PrismaService, userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tenantId: true,
      role: true,
      teamId: true,
      tenant: { select: { status: true, plan: { select: { features: true } } } },
    },
  });
  if (!user || user.tenant.status === 'SUSPENDED') return null;
  const { tenant, ...rest } = user;
  return { ...rest, features: tenant.plan.features as Feature[] };
}
