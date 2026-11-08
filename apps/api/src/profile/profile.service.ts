import { Injectable, NotFoundException } from '@nestjs/common';
import { can } from '@platform/shared';
import type { AuthUser } from '../auth/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** What any colleague can see. */
const publicSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  jobTitle: true,
  department: true,
  bio: true,
  pointsBalance: true,
  team: { select: { id: true, name: true } },
  office: { select: { city: true, region: true } },
  skills: { select: { level: true, skill: { select: { name: true } } } },
} as const;

/** Employment details: self, the person's manager, HR and the company admin. */
const detailSelect = {
  ...publicSelect,
  email: true,
  role: true,
  employeeCode: true,
  joinedAt: true,
} as const;

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  me(viewer: AuthUser) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: viewer.id }, select: detailSelect });
  }

  async byId(viewer: AuthUser, id: string) {
    const target = await this.prisma.user.findFirst({
      where: { id, tenantId: viewer.tenantId },
      select: { teamId: true },
    });
    if (!target) throw new NotFoundException();
    const select = (await this.canSeeDetails(viewer, id, target.teamId)) ? detailSelect : publicSelect;
    return this.prisma.user.findUniqueOrThrow({ where: { id }, select });
  }

  /** Managers get their own teams; HR and admins get everyone (optionally one team). */
  async people(viewer: AuthUser, teamId?: string) {
    if (can(viewer.role, 'profile.read.all')) {
      return this.prisma.user.findMany({
        where: { tenantId: viewer.tenantId, ...(teamId ? { teamId } : {}) },
        select: detailSelect,
        orderBy: { name: 'asc' },
      });
    }
    const managed = await this.managedTeamIds(viewer);
    const teamIds = teamId ? managed.filter((t) => t === teamId) : managed;
    return this.prisma.user.findMany({
      where: { tenantId: viewer.tenantId, teamId: { in: teamIds } },
      select: detailSelect,
      orderBy: { name: 'asc' },
    });
  }

  private async canSeeDetails(viewer: AuthUser, targetId: string, targetTeamId: string | null) {
    if (viewer.id === targetId || can(viewer.role, 'profile.read.all')) return true;
    if (!targetTeamId || !can(viewer.role, 'profile.read.team')) return false;
    return (await this.managedTeamIds(viewer)).includes(targetTeamId);
  }

  private async managedTeamIds(viewer: AuthUser) {
    const teams = await this.prisma.team.findMany({
      where: { tenantId: viewer.tenantId, managerId: viewer.id },
      select: { id: true },
    });
    return teams.map((t) => t.id);
  }
}
