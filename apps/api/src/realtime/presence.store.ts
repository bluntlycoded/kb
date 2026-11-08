import type { PresenceStatus } from '@platform/shared';

interface Entry {
  sockets: Set<string>;
  status: Exclude<PresenceStatus, 'OFFLINE'>;
}

/**
 * Who is online, per tenant. In-memory, so it only works with one API
 * instance. Move to Redis (and the socket.io Redis adapter) before scaling out.
 */
export class PresenceStore {
  private readonly tenants = new Map<string, Map<string, Entry>>();

  /** Returns true if the user just came online. */
  connect(tenantId: string, userId: string, socketId: string): boolean {
    const users = this.tenants.get(tenantId) ?? new Map<string, Entry>();
    this.tenants.set(tenantId, users);
    const entry = users.get(userId);
    if (entry) {
      entry.sockets.add(socketId);
      return false;
    }
    users.set(userId, { sockets: new Set([socketId]), status: 'ACTIVE' });
    return true;
  }

  /** Returns true if the user just went offline (last tab closed). */
  disconnect(tenantId: string, userId: string, socketId: string): boolean {
    const users = this.tenants.get(tenantId);
    const entry = users?.get(userId);
    if (!users || !entry) return false;
    entry.sockets.delete(socketId);
    if (entry.sockets.size > 0) return false;
    users.delete(userId);
    if (users.size === 0) this.tenants.delete(tenantId);
    return true;
  }

  setStatus(tenantId: string, userId: string, status: Entry['status']): boolean {
    const entry = this.tenants.get(tenantId)?.get(userId);
    if (!entry) return false;
    entry.status = status;
    return true;
  }

  get(tenantId: string, userId: string): PresenceStatus {
    return this.tenants.get(tenantId)?.get(userId)?.status ?? 'OFFLINE';
  }

  snapshot(tenantId: string): Record<string, PresenceStatus> {
    const users = this.tenants.get(tenantId);
    return Object.fromEntries([...(users ?? [])].map(([id, e]) => [id, e.status]));
  }
}
