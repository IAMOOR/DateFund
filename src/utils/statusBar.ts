import { StatusBar, Style } from '@capacitor/status-bar';

export async function setupStatusBar(theme: 'light' | 'dark' | 'system'): Promise<void> {
  try {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    await StatusBar.setStyle({
      style: isDark ? Style.Dark : Style.Light,
    });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    // Graceful no-op on non-Capacitor web environments
  }
}
