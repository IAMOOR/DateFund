import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock console.error BEFORE importing the module that uses it
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock dependencies
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

let mockCurrentUser: any = null;

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    get currentUser() {
      return mockCurrentUser;
    }
  })),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDocFromServer: vi.fn().mockResolvedValue({}),
}));

// Import after mocks
import { handleFirestoreError, OperationType } from '../firebase';

describe('handleFirestoreError', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCurrentUser = null;
    });

    it('should format standard Error object with auth info', () => {
        mockCurrentUser = {
            uid: 'user123',
            email: 'test@example.com',
            emailVerified: true,
            isAnonymous: false,
            tenantId: 'tenant456',
            providerData: [{
                providerId: 'google.com',
                displayName: 'Test User',
                email: 'test@example.com',
                photoURL: 'http://example.com/photo.jpg'
            }]
        };

        const testError = new Error('Permission denied');

        expect(() => {
            handleFirestoreError(testError, OperationType.GET, 'users/123');
        }).toThrow();

        expect(consoleErrorSpy).toHaveBeenCalled();
        const loggedInfo = JSON.parse(consoleErrorSpy.mock.calls[0][1]);

        expect(loggedInfo.error).toBe('Permission denied');
        expect(loggedInfo.operationType).toBe(OperationType.GET);
        expect(loggedInfo.path).toBe('users/123');
        expect(loggedInfo.authInfo.userId).toBe('user123');
        expect(loggedInfo.authInfo.email).toBe('test@example.com');
        expect(loggedInfo.authInfo.emailVerified).toBe(true);
        expect(loggedInfo.authInfo.isAnonymous).toBe(false);
        expect(loggedInfo.authInfo.tenantId).toBe('tenant456');
        expect(loggedInfo.authInfo.providerInfo).toHaveLength(1);
        expect(loggedInfo.authInfo.providerInfo[0].providerId).toBe('google.com');
        expect(loggedInfo.authInfo.providerInfo[0].displayName).toBe('Test User');
        expect(loggedInfo.authInfo.providerInfo[0].email).toBe('test@example.com');
        expect(loggedInfo.authInfo.providerInfo[0].photoUrl).toBe('http://example.com/photo.jpg');
    });

    it('should handle string errors and missing auth info', () => {
        const testError = 'String error message';

        expect(() => {
            handleFirestoreError(testError, OperationType.WRITE, null);
        }).toThrow();

        expect(consoleErrorSpy).toHaveBeenCalled();
        const loggedInfo = JSON.parse(consoleErrorSpy.mock.calls[0][1]);

        expect(loggedInfo.error).toBe('String error message');
        expect(loggedInfo.operationType).toBe(OperationType.WRITE);
        expect(loggedInfo.path).toBeNull();
        expect(loggedInfo.authInfo.userId).toBeUndefined();
        expect(loggedInfo.authInfo.email).toBeUndefined();
        expect(loggedInfo.authInfo.providerInfo).toEqual([]);
    });

    it('should handle partial user auth info (empty provider data)', () => {
        mockCurrentUser = {
            uid: 'user456',
            providerData: [] // Mock empty provider data
        };

        const testError = new Error('Not found');

        expect(() => {
            handleFirestoreError(testError, OperationType.DELETE, 'posts/1');
        }).toThrow();

        expect(consoleErrorSpy).toHaveBeenCalled();
        const loggedInfo = JSON.parse(consoleErrorSpy.mock.calls[0][1]);

        expect(loggedInfo.error).toBe('Not found');
        expect(loggedInfo.operationType).toBe(OperationType.DELETE);
        expect(loggedInfo.path).toBe('posts/1');
        expect(loggedInfo.authInfo.userId).toBe('user456');
        expect(loggedInfo.authInfo.providerInfo).toEqual([]);
        expect(loggedInfo.authInfo.email).toBeUndefined();
    });

    it('should format generic unknown type appropriately as string', () => {
        const testError = { code: 500, detail: 'Unknown object error' };

        expect(() => {
            handleFirestoreError(testError, OperationType.UPDATE, 'config');
        }).toThrow();

        expect(consoleErrorSpy).toHaveBeenCalled();
        const loggedInfo = JSON.parse(consoleErrorSpy.mock.calls[0][1]);

        expect(loggedInfo.error).toBe('[object Object]');
        expect(loggedInfo.operationType).toBe(OperationType.UPDATE);
        expect(loggedInfo.path).toBe('config');
    });
});
