import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';

const PAGE_SIZE = 50;
const MAX_GROUP_SIZE = 256;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  conversations(user: AuthUser) {
    return this.prisma.conversation.findMany({
      where: { tenantId: user.tenantId, members: { some: { userId: user.id } } },
      include: {
        members: { select: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async messages(user: AuthUser, conversationId: string, cursor?: string) {
    await this.assertMember(user, conversationId);
    return this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  /** Direct chats are reused if one already exists between the two people. */
  async create(user: AuthUser, type: 'DIRECT' | 'GROUP', memberIds: string[], name?: string) {
    const others = [...new Set(memberIds)].filter((id) => id !== user.id);
    if (type === 'DIRECT' && others.length !== 1) {
      throw new BadRequestException('A direct chat needs exactly one other person');
    }
    if (type === 'GROUP' && (others.length === 0 || others.length >= MAX_GROUP_SIZE)) {
      throw new BadRequestException(`A group needs 1 to ${MAX_GROUP_SIZE - 1} other people`);
    }
    const found = await this.prisma.user.count({ where: { tenantId: user.tenantId, id: { in: others } } });
    if (found !== others.length) throw new BadRequestException('Some members were not found');

    if (type === 'DIRECT') {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          tenantId: user.tenantId,
          type: 'DIRECT',
          AND: [{ members: { some: { userId: user.id } } }, { members: { some: { userId: others[0] } } }],
        },
      });
      if (existing) return existing;
    }

    return this.prisma.conversation.create({
      data: {
        tenantId: user.tenantId,
        type,
        name: type === 'GROUP' ? name?.trim() || null : null,
        createdById: user.id,
        members: {
          create: [{ userId: user.id, isOwner: true }, ...others.map((userId) => ({ userId }))],
        },
      },
    });
  }

  private async assertMember(user: AuthUser, conversationId: string) {
    const member = await this.prisma.conversationMember.findFirst({
      where: { conversationId, userId: user.id, conversation: { tenantId: user.tenantId } },
    });
    if (!member) throw new NotFoundException();
  }
}
