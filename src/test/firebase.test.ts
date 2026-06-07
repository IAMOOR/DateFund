import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleFirestoreError, OperationType, auth } from '../firebase';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
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

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDocFromServer: vi.fn(),
  Timestamp: { now: vi.fn() },
}));

describe('handleFirestoreError', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should format an Error object correctly with full auth info', () => {
    (auth as any).currentUser = {
      uid: 'user123',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: 'tenant1',
      providerData: [{
        providerId: 'google.com',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'http://example.com/photo.jpg'
      }]
    };

    const error = new Error('Permission denied');
    const path = 'users/123';

    expect(() => {
      handleFirestoreError(error, OperationType.GET, path);
    }).toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    const loggedErrorString = consoleSpy.mock.calls[0][1];
    const errInfo = JSON.parse(loggedErrorString);

    expect(errInfo.error).toBe('Permission denied');
    expect(errInfo.operationType).toBe(OperationType.GET);
    expect(errInfo.path).toBe(path);
    expect(errInfo.authInfo.userId).toBe('user123');
    expect(errInfo.authInfo.email).toBe('test@example.com');
    expect(errInfo.authInfo.emailVerified).toBe(true);
    expect(errInfo.authInfo.isAnonymous).toBe(false);
    expect(errInfo.authInfo.tenantId).toBe('tenant1');
    expect(errInfo.authInfo.providerInfo).toHaveLength(1);
    expect(errInfo.authInfo.providerInfo[0].providerId).toBe('google.com');
  });

  it('should handle a non-Error object string', () => {
    (auth as any).currentUser = null;

    const errorStr = 'Just a string error';

    expect(() => {
      handleFirestoreError(errorStr, OperationType.CREATE, null);
    }).toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    const loggedErrorString = consoleSpy.mock.calls[0][1];
    const errInfo = JSON.parse(loggedErrorString);

    expect(errInfo.error).toBe('Just a string error');
    expect(errInfo.operationType).toBe(OperationType.CREATE);
    expect(errInfo.path).toBeNull();
    expect(errInfo.authInfo.userId).toBeUndefined();
  });

  it('should handle missing currentUser gracefully', () => {
    (auth as any).currentUser = null;

    expect(() => {
      handleFirestoreError(new Error('Test'), OperationType.UPDATE, 'some/path');
    }).toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    const loggedErrorString = consoleSpy.mock.calls[0][1];
    const errInfo = JSON.parse(loggedErrorString);

    expect(errInfo.authInfo.userId).toBeUndefined();
    expect(errInfo.authInfo.providerInfo).toEqual([]);
  });

  it('should handle currentUser without providerData gracefully', () => {
     (auth as any).currentUser = {
      uid: 'user123'
    };

    expect(() => {
      handleFirestoreError(new Error('Test'), OperationType.DELETE, 'path');
    }).toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    const loggedErrorString = consoleSpy.mock.calls[0][1];
    const errInfo = JSON.parse(loggedErrorString);

    expect(errInfo.authInfo.userId).toBe('user123');
    expect(errInfo.authInfo.providerInfo).toEqual([]);
  });
});
