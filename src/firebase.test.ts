import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleFirestoreError, OperationType, auth } from './firebase';
import { getAuth } from 'firebase/auth';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  getDocFromServer: vi.fn(() => Promise.reject(new Error('test connection failed'))),
  doc: vi.fn(),
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
  getAuth: vi.fn(() => ({ currentUser: null })),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

describe('handleFirestoreError', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
    // Reset mock auth object properties directly since the module level variable uses it
    (auth as any).currentUser = null;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should format and throw an error for Error objects', () => {
    const error = new Error('Test error message');

    let caughtError: Error | undefined;
    try {
      handleFirestoreError(error, OperationType.GET, 'test/path');
    } catch (e) {
      caughtError = e as Error;
    }

    expect(caughtError).toBeDefined();
    const errorInfo = JSON.parse(caughtError!.message);

    expect(errorInfo.error).toBe('Test error message');
    expect(errorInfo.operationType).toBe(OperationType.GET);
    expect(errorInfo.path).toBe('test/path');
    expect(errorInfo.authInfo).toBeDefined();

    expect(console.error).toHaveBeenCalled();
  });

  it('should format and throw an error for non-Error objects', () => {
    const error = 'String error message';

    let caughtError: Error | undefined;
    try {
      handleFirestoreError(error, OperationType.CREATE, 'test/path2');
    } catch (e) {
      caughtError = e as Error;
    }

    expect(caughtError).toBeDefined();
    const errorInfo = JSON.parse(caughtError!.message);

    expect(errorInfo.error).toBe('String error message');
    expect(errorInfo.operationType).toBe(OperationType.CREATE);
    expect(errorInfo.path).toBe('test/path2');
  });

  it('should include auth user info when user is logged in', () => {
    (auth as any).currentUser = {
      uid: 'user123',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: 'tenant-1',
      providerData: [
        {
          providerId: 'google.com',
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: 'http://example.com/photo.jpg'
        }
      ]
    };

    const error = new Error('Auth test error');

    let caughtError: Error | undefined;
    try {
      handleFirestoreError(error, OperationType.UPDATE, 'test/path3');
    } catch (e) {
      caughtError = e as Error;
    }

    expect(caughtError).toBeDefined();
    const errorInfo = JSON.parse(caughtError!.message);

    expect(errorInfo.authInfo).toEqual({
      userId: 'user123',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: 'tenant-1',
      providerInfo: [
        {
          providerId: 'google.com',
          displayName: 'Test User',
          email: 'test@example.com',
          photoUrl: 'http://example.com/photo.jpg'
        }
      ]
    });
  });
});
