import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  RealtimeEvent,
  type GameInvitePayload,
  type GameInviteResponsePayload,
} from '@platform/shared';
import type { AuthUser } from '../auth/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RealtimeGateway } from '../realtime/realtime.gateway.js';
import { findGame } from './catalog.js';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async invite(user: AuthUser, gameKey: string, inviteeIds: string[], quizId?: string) {
    const game = findGame(gameKey);
    if (!game) throw new BadRequestException('Unknown game');
    const invitees = [...new Set(inviteeIds)].filter((id) => id !== user.id);
    if (invitees.length + 1 > game.maxPlayers) {
      throw new BadRequestException(`${game.name} allows at most ${game.maxPlayers} players`);
    }
    const found = await this.prisma.user.count({ where: { tenantId: user.tenantId, id: { in: invitees } } });
    if (found !== invitees.length) throw new BadRequestException('Some invitees were not found');
    if (quizId) {
      const quiz = await this.prisma.quiz.findFirst({ where: { id: quizId, tenantId: user.tenantId } });
      if (!quiz) throw new BadRequestException('Quiz not found');
    }

    const session = await this.prisma.gameSession.create({
      data: {
        tenantId: user.tenantId,
        gameKey,
        quizId: quizId ?? null,
        hostId: user.id,
        players: {
          create: [{ userId: user.id, status: 'ACCEPTED' }, ...invitees.map((userId) => ({ userId }))],
        },
      },
    });
    const payload: GameInvitePayload = { sessionId: session.id, gameKey, fromUserId: user.id, toUserIds: invitees };
    this.realtime.emitToUsers(invitees, RealtimeEvent.GameInvite, payload);
    return session;
  }

  async respond(user: AuthUser, sessionId: string, accepted: boolean) {
    const session = await this.prisma.gameSession.findFirst({
      where: { id: sessionId, tenantId: user.tenantId, status: 'INVITING', players: { some: { userId: user.id } } },
      select: { id: true, players: { select: { userId: true } } },
    });
    if (!session) throw new NotFoundException();

    await this.prisma.gameSessionPlayer.update({
      where: { sessionId_userId: { sessionId, userId: user.id } },
      data: { status: accepted ? 'ACCEPTED' : 'DECLINED' },
    });
    const payload: GameInviteResponsePayload = { sessionId, userId: user.id, accepted };
    this.realtime.emitToUsers(
      session.players.map((p) => p.userId),
      RealtimeEvent.GameInviteResponse,
      payload,
    );
    return payload;
  }

  async session(user: AuthUser, sessionId: string) {
    const session = await this.prisma.gameSession.findFirst({
      where: { id: sessionId, tenantId: user.tenantId, players: { some: { userId: user.id } } },
      include: { players: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
    });
    if (!session) throw new NotFoundException();
    return {
      ...session,
      players: session.players.map((p) => ({ ...p, presence: this.realtime.presenceOf(user.tenantId, p.userId) })),
    };
  }
}
