import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Points per praise. Placeholder until the client defines the points economy. */
export const PRAISE_POINTS = 10;
const PAGE_SIZE = 20;

const personSelect = { select: { id: true, name: true, avatarUrl: true, jobTitle: true } } as const;

@Injectable()
export class CohortService {
  constructor(private readonly prisma: PrismaService) {}

  feed(user: AuthUser, cursor?: string) {
    return this.prisma.praise.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { author: personSelect, recipient: personSelect },
    });
  }

  async givePraise(user: AuthUser, recipientId: string, message: string, kind: 'PRAISE' | 'ACHIEVEMENT') {
    if (recipientId === user.id) throw new BadRequestException('You cannot praise yourself');
    const recipient = await this.prisma.user.findFirst({
      where: { id: recipientId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!recipient) throw new NotFoundException('Recipient not found');

    return this.prisma.$transaction(async (tx) => {
      const praise = await tx.praise.create({
        data: { tenantId: user.tenantId, authorId: user.id, recipientId, message, kind, points: PRAISE_POINTS },
      });
      await tx.pointsEntry.create({
        data: {
          tenantId: user.tenantId,
          userId: recipientId,
          delta: PRAISE_POINTS,
          reason: 'PRAISE_RECEIVED',
          refId: praise.id,
        },
      });
      await tx.user.update({
        where: { id: recipientId },
        data: { pointsBalance: { increment: PRAISE_POINTS } },
      });
      return praise;
    });
  }
}
