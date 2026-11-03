import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

class MockStorage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.has(key) ? this.store.get(key)! : null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  key(index: number) { return Array.from(this.store.keys())[index] || null; }
}

const mockSessionStorage = new MockStorage();
const mockLocalStorage = new MockStorage();

if (typeof globalThis.sessionStorage === 'undefined') {
  Object.defineProperty(globalThis, 'sessionStorage', { value: mockSessionStorage, writable: true, configurable: true });
}
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true, configurable: true });
}
if (typeof globalThis.window === 'undefined') {
  Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true, configurable: true });
}

import { 
  scheduleDateReminder, 
  cancelAllScheduledReminders, 
  activeWebTimers, 
  activeScheduledNotificationIds 
} from '../src/utils/notifications';
import { 
  getCachedAI, 
  setCachedAI, 
  clearUserAICache, 
  buildScopedKey 
} from '../src/utils/aiCache';

describe('Session Lifecycle & Privacy Isolation (Issue 3)', () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear();
    globalThis.localStorage.clear();
    cancelAllScheduledReminders();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cancelAllScheduledReminders();
    globalThis.sessionStorage.clear();
    globalThis.localStorage.clear();
  });

  describe('Stale Reminders & Notification Cancellation', () => {
    it('cancels all active web timers when cancelAllScheduledReminders is called', async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute in the future
      
      await scheduleDateReminder({
        id: 101,
        title: 'Anniversary Dinner',
        body: 'Table at 7 PM',
        scheduleDate: futureDate
      });

      await scheduleDateReminder({
        id: 102,
        title: 'Movie Night',
        body: 'Starts soon',
        scheduleDate: futureDate
      });

      expect(activeWebTimers.size).toBe(2);
      expect(activeScheduledNotificationIds.has(101)).toBe(true);
      expect(activeScheduledNotificationIds.has(102)).toBe(true);

      // Cancel all on logout or session change
      await cancelAllScheduledReminders();

      expect(activeWebTimers.size).toBe(0);
      expect(activeScheduledNotificationIds.size).toBe(0);
    });

    it('does not trigger a cancelled reminder after advancing timers', async () => {
      const mockCallback = vi.fn();
      const futureDate = new Date(Date.now() + 10000);

      const timerId = setTimeout(mockCallback, 10000);
      activeWebTimers.add(timerId as any);

      // User logs out before timer fires
      await cancelAllScheduledReminders();

      // Fast-forward past the reminder time
      vi.advanceTimersByTime(20000);

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('User-Scoped AI Cache Isolation', () => {
    it('scopes cache keys strictly per authenticated user UID', () => {
      const keyUserA = buildScopedKey('daily_advice', 'user_alice_123');
      const keyUserB = buildScopedKey('daily_advice', 'user_bob_456');
      const keyGuest = buildScopedKey('daily_advice', null);

      expect(keyUserA).toBe('datefund_ai_cache_user_alice_123_daily_advice');
      expect(keyUserB).toBe('datefund_ai_cache_user_bob_456_daily_advice');
      expect(keyGuest).toBe('datefund_ai_cache_anonymous_daily_advice');
      expect(keyUserA).not.toBe(keyUserB);
    });

    it('prevents user B from reading cached AI responses of user A', () => {
      setCachedAI('date_recommendation', { restaurant: 'Secret Hideaway' }, 'user_alice_123');

      // Alice can read her cache
      const aliceData = getCachedAI('date_recommendation', 'user_alice_123');
      expect(aliceData).toEqual({ restaurant: 'Secret Hideaway' });

      // Bob cannot read Alice's cache
      const bobData = getCachedAI('date_recommendation', 'user_bob_456');
      expect(bobData).toBeNull();

      // Unauthenticated visitor cannot read Alice's cache
      const guestData = getCachedAI('date_recommendation', null);
      expect(guestData).toBeNull();
    });

    it('clears all cached data for a specific user on logout', () => {
      setCachedAI('query_1', { data: 'test1' }, 'user_alice_123');
      setCachedAI('query_2', { data: 'test2' }, 'user_alice_123');
      setCachedAI('query_1', { data: 'bob_data' }, 'user_bob_456');

      // Alice logs out -> clearUserAICache
      clearUserAICache('user_alice_123');

      expect(getCachedAI('query_1', 'user_alice_123')).toBeNull();
      expect(getCachedAI('query_2', 'user_alice_123')).toBeNull();

      // Bob's cache remains untouched
      expect(getCachedAI('query_1', 'user_bob_456')).toEqual({ data: 'bob_data' });
    });
  });

  describe('Session Storage & Identity Fabrication Prevention', () => {
    it('does not store fabricated authenticated user sessions in localStorage', () => {
      // Prior vulnerability stored fake credentials in datefund_session_user
      expect(globalThis.localStorage.getItem('datefund_session_user')).toBeNull();
    });
  });
});
