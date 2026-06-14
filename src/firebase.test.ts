import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
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



vi.mock('firebase/auth', () => {
  return {
  getAuth: vi.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerData: [
        {
          providerId: 'google.com',
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: 'https://example.com/photo.jpg',
        },
      ],
    },
  })),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  };
});

import { handleFirestoreError, OperationType } from './firebase';

describe('handleFirestoreError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('formats an Error object correctly and throws it', () => {
    const error = new Error('Test firestore error');
    const expectedErrorString = JSON.stringify({
      error: 'Test firestore error',
      authInfo: {
        userId: 'test-user-id',
        email: 'test@example.com',
        emailVerified: true,
        isAnonymous: false,
        tenantId: null,
        providerInfo: [
          {
            providerId: 'google.com',
            displayName: 'Test User',
            email: 'test@example.com',
            photoUrl: 'https://example.com/photo.jpg',
          },
        ],
      },
      operationType: OperationType.GET,
      path: 'users/123',
    });

    expect(() => handleFirestoreError(error, OperationType.GET, 'users/123')).toThrow(expectedErrorString);
    expect(console.error).toHaveBeenCalledWith('Firestore Error: ', expectedErrorString);
  });

  it('formats a non-Error object correctly and throws it', () => {
    const error = 'String error message';
    const expectedErrorString = JSON.stringify({
      error: 'String error message',
      authInfo: {
        userId: 'test-user-id',
        email: 'test@example.com',
        emailVerified: true,
        isAnonymous: false,
        tenantId: null,
        providerInfo: [
          {
            providerId: 'google.com',
            displayName: 'Test User',
            email: 'test@example.com',
            photoUrl: 'https://example.com/photo.jpg',
          },
        ],
      },
      operationType: OperationType.WRITE,
      path: null,
    });

    expect(() => handleFirestoreError(error, OperationType.WRITE, null)).toThrow(expectedErrorString);
    expect(console.error).toHaveBeenCalledWith('Firestore Error: ', expectedErrorString);
  });
});
