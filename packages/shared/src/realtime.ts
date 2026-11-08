export const PRESENCE_STATUSES = ['ACTIVE', 'AWAY', 'BUSY', 'OFFLINE'] as const;
export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

/** Socket.io event names shared by the API gateway and the web client. */
export const RealtimeEvent = {
  PresenceSet: 'presence:set',
  PresenceUpdate: 'presence:update',
  PresenceSnapshot: 'presence:snapshot',
  ChatSend: 'chat:send',
  ChatMessage: 'chat:message',
  GameInvite: 'game:invite',
  GameInviteResponse: 'game:invite:response',
} as const;

export interface PresenceUpdatePayload {
  userId: string;
  status: PresenceStatus;
}

export interface GameInvitePayload {
  sessionId: string;
  gameKey: string;
  fromUserId: string;
  toUserIds: string[];
}

export interface GameInviteResponsePayload {
  sessionId: string;
  userId: string;
  accepted: boolean;
}
