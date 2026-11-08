import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { RealtimeEvent, type PresenceStatus } from '@platform/shared';
import type { Server, Socket } from 'socket.io';
import type { AuthUser } from '../auth/auth-user.js';
import { loadAuthUser } from '../auth/load-auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PresenceStore } from './presence.store.js';

const tenantRoom = (tenantId: string) => `tenant:${tenantId}`;
const userRoom = (userId: string) => `user:${userId}`;
const SETTABLE: readonly PresenceStatus[] = ['ACTIVE', 'AWAY', 'BUSY'];

type AuthedSocket = Socket & { data: { user: AuthUser } };

@WebSocketGateway({
  cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() private server!: Server;
  private readonly presence = new PresenceStore();
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(socket: Socket) {
    const user = await this.authenticate(socket);
    if (!user) {
      socket.disconnect(true);
      return;
    }
    socket.data.user = user;
    await socket.join([tenantRoom(user.tenantId), userRoom(user.id)]);
    socket.emit(RealtimeEvent.PresenceSnapshot, this.presence.snapshot(user.tenantId));
    if (this.presence.connect(user.tenantId, user.id, socket.id)) {
      this.broadcastPresence(user, 'ACTIVE');
    }
  }

  handleDisconnect(socket: Socket) {
    const user = (socket as AuthedSocket).data.user as AuthUser | undefined;
    if (user && this.presence.disconnect(user.tenantId, user.id, socket.id)) {
      this.broadcastPresence(user, 'OFFLINE');
    }
  }

  @SubscribeMessage(RealtimeEvent.PresenceSet)
  setPresence(@ConnectedSocket() socket: AuthedSocket, @MessageBody() body: { status?: PresenceStatus }) {
    const { user } = socket.data;
    if (!body?.status || !SETTABLE.includes(body.status)) return;
    if (this.presence.setStatus(user.tenantId, user.id, body.status as Exclude<PresenceStatus, 'OFFLINE'>)) {
      this.broadcastPresence(user, body.status);
    }
  }

  @SubscribeMessage(RealtimeEvent.ChatSend)
  async sendChat(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() body: { conversationId?: string; body?: string },
  ) {
    const { user } = socket.data;
    const text = body?.body?.trim();
    if (!body?.conversationId || !text) return { ok: false, error: 'conversationId and body are required' };

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: body.conversationId, tenantId: user.tenantId, members: { some: { userId: user.id } } },
      select: { id: true, members: { select: { userId: true } } },
    });
    if (!conversation) return { ok: false, error: 'Conversation not found' };

    const message = await this.prisma.message.create({
      data: { tenantId: user.tenantId, conversationId: conversation.id, senderId: user.id, body: text },
    });
    this.emitToUsers(
      conversation.members.map((m) => m.userId),
      RealtimeEvent.ChatMessage,
      message,
    );
    return { ok: true, id: message.id };
  }

  /** Used by other modules (e.g. games) to push events to specific people. */
  emitToUsers(userIds: string[], event: string, payload: unknown) {
    if (userIds.length === 0) return;
    this.server.to(userIds.map(userRoom)).emit(event, payload);
  }

  presenceOf(tenantId: string, userId: string): PresenceStatus {
    return this.presence.get(tenantId, userId);
  }

  private broadcastPresence(user: AuthUser, status: PresenceStatus) {
    this.server.to(tenantRoom(user.tenantId)).emit(RealtimeEvent.PresenceUpdate, { userId: user.id, status });
  }

  /** Dev-only: trusts `auth.devUserId` from the handshake. Replace with real tokens. */
  private async authenticate(socket: Socket): Promise<AuthUser | null> {
    if (process.env.NODE_ENV === 'production') return null;
    const userId = (socket.handshake.auth as { devUserId?: unknown }).devUserId;
    if (typeof userId !== 'string') return null;
    try {
      return await loadAuthUser(this.prisma, userId);
    } catch (err) {
      this.logger.error('Socket auth failed', err as Error);
      return null;
    }
  }
}
