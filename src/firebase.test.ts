import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { testConnection } from './firebase';
import { getDocFromServer, doc } from 'firebase/firestore';

// Mock firebase/firestore
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    getDocFromServer: vi.fn(),
    doc: vi.fn(),
    getFirestore: vi.fn(),
  };
});

// Mock firebase/app
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
  })),
  GoogleAuthProvider: vi.fn(),
}));

// Mock the config file
vi.mock('../firebase-applet-config.json', () => ({
  default: {
    apiKey: 'mock-api-key',
    authDomain: 'mock-auth-domain',
    projectId: 'mock-project-id',
    storageBucket: 'mock-storage-bucket',
    messagingSenderId: 'mock-sender-id',
    appId: 'mock-app-id',
    firestoreDatabaseId: 'mock-db-id',
  },
}));

describe('testConnection', () => {
  let consoleSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log an error message when the client is offline', async () => {
    const offlineError = new Error('the client is offline');
    vi.mocked(getDocFromServer).mockRejectedValue(offlineError);

    await testConnection();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Please check your Firebase configuration. The client is offline."
    );
  });

  it('should not log an error message for other types of errors', async () => {
    const otherError = new Error('some other error');
    vi.mocked(getDocFromServer).mockRejectedValue(otherError);

    await testConnection();

    expect(consoleSpy).not.toHaveBeenCalledWith(
      "Please check your Firebase configuration. The client is offline."
    );
  });

  it('should not log anything when the connection is successful', async () => {
    vi.mocked(getDocFromServer).mockResolvedValue({ exists: () => true } as any);

    await testConnection();

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
