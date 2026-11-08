import { PresenceStore } from './presence.store.js';

describe('PresenceStore', () => {
  it('stays online until the last socket disconnects', () => {
    const store = new PresenceStore();
    expect(store.connect('t1', 'u1', 's1')).toBe(true);
    expect(store.connect('t1', 'u1', 's2')).toBe(false);
    expect(store.disconnect('t1', 'u1', 's1')).toBe(false);
    expect(store.get('t1', 'u1')).toBe('ACTIVE');
    expect(store.disconnect('t1', 'u1', 's2')).toBe(true);
    expect(store.get('t1', 'u1')).toBe('OFFLINE');
  });

  it('keeps tenants apart', () => {
    const store = new PresenceStore();
    store.connect('t1', 'u1', 's1');
    store.connect('t2', 'u2', 's2');
    store.setStatus('t1', 'u1', 'BUSY');
    expect(store.snapshot('t1')).toEqual({ u1: 'BUSY' });
    expect(store.snapshot('t2')).toEqual({ u2: 'ACTIVE' });
  });

  it('ignores status changes for offline users', () => {
    const store = new PresenceStore();
    expect(store.setStatus('t1', 'ghost', 'AWAY')).toBe(false);
  });
});
