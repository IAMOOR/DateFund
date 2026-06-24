import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleFirestoreError, OperationType, auth } from './firebase';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDocFromServer: vi.fn().mockRejectedValue(new Error('offline')),
  collection: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null
  })),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

describe('handleFirestoreError', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('formats Error objects correctly', () => {
    const error = new Error('Test error');

    expect(() => handleFirestoreError(error, OperationType.GET, 'test/path')).toThrow();

    expect(consoleErrorSpy).toHaveBeenCalled();
    const loggedError = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
    expect(loggedError.error).toBe('Test error');
    expect(loggedError.operationType).toBe(OperationType.GET);
    expect(loggedError.path).toBe('test/path');
    expect(loggedError.authInfo.userId).toBeUndefined();
  });

  it('formats string errors correctly', () => {
    const error = 'Some string error';

    expect(() => handleFirestoreError(error, OperationType.WRITE, 'other/path')).toThrow();

    expect(consoleErrorSpy).toHaveBeenCalled();
    const loggedError = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
    expect(loggedError.error).toBe('Some string error');
  });

  it('formats non-Error objects correctly', () => {
    const error = { code: 'not-found' };

    expect(() => handleFirestoreError(error, OperationType.UPDATE, null)).toThrow();

    expect(consoleErrorSpy).toHaveBeenCalled();
    const loggedError = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
    expect(loggedError.error).toBe('[object Object]');
  });

  it('includes auth info when user is signed in', () => {
    // Mock the currentUser getter
    Object.defineProperty(auth, 'currentUser', {
      value: {
        uid: 'user123',
        email: 'test@example.com',
        emailVerified: true,
        isAnonymous: false,
        tenantId: 'tenant1',
        providerData: [{
          providerId: 'google.com',
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: 'https://example.com/photo.jpg'
        }]
      },
      configurable: true
    });

    const error = new Error('Test auth error');
    expect(() => handleFirestoreError(error, OperationType.DELETE, 'auth/path')).toThrow();

    const loggedError = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
    expect(loggedError.authInfo).toEqual({
      userId: 'user123',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: 'tenant1',
      providerInfo: [{
        providerId: 'google.com',
        displayName: 'Test User',
        email: 'test@example.com',
        photoUrl: 'https://example.com/photo.jpg'
      }]
    });

    // Reset auth for other tests
    Object.defineProperty(auth, 'currentUser', { value: null, configurable: true });
  });

  it('handles user with empty providerData', () => {
    Object.defineProperty(auth, 'currentUser', {
      value: {
        uid: 'user456',
        email: 'test2@example.com',
        providerData: []
      },
      configurable: true
    });

    expect(() => handleFirestoreError(new Error(), OperationType.CREATE, 'path')).toThrow();

    const loggedError = JSON.parse(consoleErrorSpy.mock.calls[0][1]);
    expect(loggedError.authInfo.providerInfo).toEqual([]);

    Object.defineProperty(auth, 'currentUser', { value: null, configurable: true });
  });
});
