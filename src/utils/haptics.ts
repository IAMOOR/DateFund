import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function hapticLight(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }
}

export async function hapticMedium(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
  }
}

export async function hapticSuccess(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 60, 40]);
    }
  }
}

export async function hapticCelebration(): Promise<void> {
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    setTimeout(async () => {
      try {
        await Haptics.notification({ type: NotificationType.Success });
      } catch {}
    }, 150);
  } catch {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 50, 100, 50, 150]);
    }
  }
}
