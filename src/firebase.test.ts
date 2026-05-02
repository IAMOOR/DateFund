import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleFirestoreError, OperationType, auth } from './firebase';
import { User } from 'firebase/auth';

// Mock the Firebase modules to avoid actual connections and errors
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
  getDocFromServer: vi.fn(() => Promise.resolve()), // mock for testConnection
  Timestamp: { now: vi.fn() },
}));

// Mock firebaseConfig to prevent warning logs
vi.mock('../firebase-applet-config.json', () => ({
  default: {
    apiKey: 'mock-api-key',
    authDomain: 'mock-auth-domain',
    projectId: 'mock-project-id',
    storageBucket: 'mock-storage-bucket',
    messagingSenderId: 'mock-messaging-sender-id',
    appId: 'mock-app-id',
    firestoreDatabaseId: 'mock-db-id'
  }
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null, // Default to null, tests will override
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
  const originalConsoleError = console.error;
  let mockConsoleError: any;

  beforeEach(() => {
    mockConsoleError = vi.fn();
    console.error = mockConsoleError;
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  it('should format error from an Error instance', () => {
    // Unauthenticated setup
    Object.defineProperty(auth, 'currentUser', { value: null, configurable: true });

    const testError = new Error('Permission denied');
    const expectedError = {
      error: 'Permission denied',
      authInfo: {
        userId: undefined,
        email: undefined,
        emailVerified: undefined,
        isAnonymous: undefined,
        tenantId: undefined,
        providerInfo: [],
      },
      operationType: OperationType.GET,
      path: 'users/123'
    };

    expect(() => handleFirestoreError(testError, OperationType.GET, 'users/123'))
      .toThrowError(new Error(JSON.stringify(expectedError)));

    expect(mockConsoleError).toHaveBeenCalledWith('Firestore Error: ', JSON.stringify(expectedError));
  });

  it('should format error from a string', () => {
    // Unauthenticated setup
    Object.defineProperty(auth, 'currentUser', { value: null, configurable: true });

    const testError = 'Unknown error occurred';
    const expectedError = {
      error: 'Unknown error occurred',
      authInfo: {
        userId: undefined,
        email: undefined,
        emailVerified: undefined,
        isAnonymous: undefined,
        tenantId: undefined,
        providerInfo: [],
      },
      operationType: OperationType.WRITE,
      path: null
    };

    expect(() => handleFirestoreError(testError, OperationType.WRITE, null))
      .toThrowError(new Error(JSON.stringify(expectedError)));

    expect(mockConsoleError).toHaveBeenCalledWith('Firestore Error: ', JSON.stringify(expectedError));
  });

  it('should include authenticated user information', () => {
    // Authenticated setup
    const mockUser = {
      uid: 'user-123',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: 'tenant-456',
      providerData: [
        {
          providerId: 'google.com',
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: 'https://example.com/photo.jpg',
          uid: 'google-uid'
        }
      ]
    } as unknown as User;

    Object.defineProperty(auth, 'currentUser', { value: mockUser, configurable: true });

    const testError = new Error('Not found');
    const expectedError = {
      error: 'Not found',
      authInfo: {
        userId: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        isAnonymous: false,
        tenantId: 'tenant-456',
        providerInfo: [
          {
            providerId: 'google.com',
            displayName: 'Test User',
            email: 'test@example.com',
            photoUrl: 'https://example.com/photo.jpg'
          }
        ],
      },
      operationType: OperationType.GET,
      path: 'posts/456'
    };

    expect(() => handleFirestoreError(testError, OperationType.GET, 'posts/456'))
      .toThrowError(new Error(JSON.stringify(expectedError)));

    expect(mockConsoleError).toHaveBeenCalledWith('Firestore Error: ', JSON.stringify(expectedError));
  });

  it('should handle authenticated user without providerData', () => {
    // Authenticated setup without provider data
    const mockUser = {
      uid: 'user-456',
      email: 'no-provider@example.com',
      providerData: []
    } as unknown as User;

    Object.defineProperty(auth, 'currentUser', { value: mockUser, configurable: true });

    const testError = new Error('Failed to create');
    const expectedError = {
      error: 'Failed to create',
      authInfo: {
        userId: 'user-456',
        email: 'no-provider@example.com',
        emailVerified: undefined,
        isAnonymous: undefined,
        tenantId: undefined,
        providerInfo: [],
      },
      operationType: OperationType.CREATE,
      path: 'posts'
    };

    expect(() => handleFirestoreError(testError, OperationType.CREATE, 'posts'))
      .toThrowError(new Error(JSON.stringify(expectedError)));

    expect(mockConsoleError).toHaveBeenCalledWith('Firestore Error: ', JSON.stringify(expectedError));
  });
});
