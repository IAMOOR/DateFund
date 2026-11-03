import { LocalNotifications } from '@capacitor/local-notifications';

// In-memory registry of active browser timer IDs to ensure reliable cancellation upon logout or session switch
export const activeWebTimers: Set<number> = new Set();
export const activeScheduledNotificationIds: Set<number> = new Set();

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const status = await LocalNotifications.requestPermissions();
    if (status.display === 'granted') return true;
  } catch {
    // Fall back to web Notification API
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
    }
  }
  return false;
}

export async function scheduleDateReminder(options: {
  id: number;
  title: string;
  body: string;
  scheduleDate: Date;
}): Promise<void> {
  const { id, title, body, scheduleDate } = options;
  if (scheduleDate.getTime() <= Date.now()) {
    // Date is in the past or right now, trigger immediately if permission allows
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    } catch {}
    return;
  }

  activeScheduledNotificationIds.add(id);

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: { at: scheduleDate },
          sound: undefined,
          actionTypeId: '',
          extra: null,
        },
      ],
    });
  } catch (err) {
    // Fallback on web: schedule a setTimeout within current active session
    const delay = scheduleDate.getTime() - Date.now();
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      const timerId = window.setTimeout(() => {
        activeWebTimers.delete(timerId);
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body });
        }
      }, delay);
      activeWebTimers.add(timerId);
    }
  }
}

/**
 * Cancels all active scheduled reminders and notification timers.
 * MUST be invoked whenever the authenticated user logs out, switches accounts,
 * or clears session state to ensure session isolation and prevent cross-user alerts.
 */
export async function cancelAllScheduledReminders(): Promise<void> {
  // 1. Clear all pending browser web timers
  activeWebTimers.forEach(timerId => {
    try {
      clearTimeout(timerId);
    } catch (e) {
      console.warn("[Notifications] Error clearing timer:", e);
    }
  });
  activeWebTimers.clear();

  // 2. Cancel native notifications via Capacitor
  try {
    const idsToCancel = Array.from(activeScheduledNotificationIds);
    if (idsToCancel.length > 0) {
      await LocalNotifications.cancel({
        notifications: idsToCancel.map(id => ({ id }))
      });
    }
    // Also remove delivered notifications to prevent stale banner leakage on shared device
    await LocalNotifications.removeAllDeliveredNotifications().catch(() => {});
  } catch {
    // Capacitor might not be available in standard browser environment
  }
  activeScheduledNotificationIds.clear();
}
