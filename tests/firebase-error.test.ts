import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleFirestoreError, OperationType, auth } from '../src/firebase';

describe('Firebase Error Handler (handleFirestoreError)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    // Reset auth.currentUser to null after each test
    Object.defineProperty(auth, 'currentUser', {
      value: null,
      writable: true,
      configurable: true,
    });
  });

  describe('Unauthenticated User Scenarios', () => {
    it('throws formatted error with undefined auth fields when auth.currentUser is null', () => {
      Object.defineProperty(auth, 'currentUser', {
        value: null,
        writable: true,
        configurable: true,
      });

      const rawError = new Error('Permission denied');
      let thrownError: Error | undefined;

      try {
        handleFirestoreError(rawError, OperationType.GET, 'goals/goal_123');
      } catch (err) {
        thrownError = err as Error;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError).toBeInstanceOf(Error);

      const parsed = JSON.parse(thrownError!.message);
      expect(parsed).toEqual({
        error: 'Permission denied',
        operationType: 'get',
        path: 'goals/goal_123',
        authInfo: {
          userId: undefined,
          email: undefined,
          emailVerified: undefined,
          isAnonymous: undefined,
          tenantId: undefined,
          providerInfo: [],
        },
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Firestore Error: ',
        thrownError!.message
      );
    });

    it('handles null path correctly when path is not provided', () => {
      Object.defineProperty(auth, 'currentUser', {
        value: null,
        writable: true,
        configurable: true,
      });

      expect(() => {
        handleFirestoreError(new Error('Missing collection'), OperationType.LIST, null);
      }).toThrow();

      try {
        handleFirestoreError(new Error('Missing collection'), OperationType.LIST, null);
      } catch (err: any) {
        const parsed = JSON.parse(err.message);
        expect(parsed.path).toBeNull();
        expect(parsed.operationType).toBe('list');
      }
    });
  });

  describe('Authenticated User Scenarios', () => {
    it('populates full authInfo when user is signed in with email and provider details', () => {
      const mockUser = {
        uid: 'user_test_999',
        email: 'tester@example.com',
        emailVerified: true,
        isAnonymous: false,
        tenantId: 'tenant_abc',
        providerData: [
          {
            providerId: 'google.com',
            displayName: 'Google Tester',
            email: 'tester@gmail.com',
            photoURL: 'https://example.com/photo.jpg',
          },
          {
            providerId: 'password',
            displayName: null,
            email: 'tester@example.com',
            photoURL: null,
          },
        ],
      };

      Object.defineProperty(auth, 'currentUser', {
        value: mockUser,
        writable: true,
        configurable: true,
      });

      const rawError = new Error('Quota exceeded');
      let caughtError: Error | undefined;

      try {
        handleFirestoreError(rawError, OperationType.CREATE, 'transactions/tx_101');
      } catch (err) {
        caughtError = err as Error;
      }

      expect(caughtError).toBeDefined();
      const parsed = JSON.parse(caughtError!.message);

      expect(parsed).toEqual({
        error: 'Quota exceeded',
        operationType: 'create',
        path: 'transactions/tx_101',
        authInfo: {
          userId: 'user_test_999',
          email: 'tester@example.com',
          emailVerified: true,
          isAnonymous: false,
          tenantId: 'tenant_abc',
          providerInfo: [
            {
              providerId: 'google.com',
              displayName: 'Google Tester',
              email: 'tester@gmail.com',
              photoUrl: 'https://example.com/photo.jpg',
            },
            {
              providerId: 'password',
              displayName: null,
              email: 'tester@example.com',
              photoUrl: null,
            },
          ],
        },
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Firestore Error: ', caughtError!.message);
    });

    it('gracefully handles user with undefined or empty providerData', () => {
      const mockUser = {
        uid: 'user_anonymous_555',
        email: null,
        emailVerified: false,
        isAnonymous: true,
        tenantId: null,
        providerData: [] as any[],
      };

      Object.defineProperty(auth, 'currentUser', {
        value: mockUser,
        writable: true,
        configurable: true,
      });

      try {
        handleFirestoreError(new Error('Rule check failed'), OperationType.WRITE, 'events/ev_1');
      } catch (err: any) {
        const parsed = JSON.parse(err.message);
        expect(parsed.authInfo.userId).toBe('user_anonymous_555');
        expect(parsed.authInfo.isAnonymous).toBe(true);
        expect(parsed.authInfo.providerInfo).toEqual([]);
      }
    });
  });

  describe('Error Type & Non-Error Handling', () => {
    it('extracts error.message when error is an instance of Error', () => {
      const errorInstance = new TypeError('Cannot read property of undefined');

      try {
        handleFirestoreError(errorInstance, OperationType.UPDATE, 'goals/g1');
      } catch (err: any) {
        const parsed = JSON.parse(err.message);
        expect(parsed.error).toBe('Cannot read property of undefined');
        expect(parsed.operationType).toBe('update');
      }
    });

    it('stringifies error when error is a primitive string', () => {
      try {
        handleFirestoreError('Network connection timeout', OperationType.DELETE, 'events/e1');
      } catch (err: any) {
        const parsed = JSON.parse(err.message);
        expect(parsed.error).toBe('Network connection timeout');
        expect(parsed.operationType).toBe('delete');
      }
    });

    it('stringifies error when error is a number or primitive value', () => {
      try {
        handleFirestoreError(404, OperationType.GET, 'goals/unknown');
      } catch (err: any) {
        const parsed = JSON.parse(err.message);
        expect(parsed.error).toBe('404');
        expect(parsed.operationType).toBe('get');
      }
    });

    it('stringifies error when error is a plain object', () => {
      const customObj = { code: 'unavailable', details: 'service degraded' };

      try {
        handleFirestoreError(customObj, OperationType.WRITE, null);
      } catch (err: any) {
        const parsed = JSON.parse(err.message);
        expect(parsed.error).toBe('[object Object]');
        expect(parsed.operationType).toBe('write');
        expect(parsed.path).toBeNull();
      }
    });
  });

  describe('OperationType Enum Coverage', () => {
    const testCases: { op: OperationType; expectedStr: string }[] = [
      { op: OperationType.CREATE, expectedStr: 'create' },
      { op: OperationType.UPDATE, expectedStr: 'update' },
      { op: OperationType.DELETE, expectedStr: 'delete' },
      { op: OperationType.LIST, expectedStr: 'list' },
      { op: OperationType.GET, expectedStr: 'get' },
      { op: OperationType.WRITE, expectedStr: 'write' },
    ];

    testCases.forEach(({ op, expectedStr }) => {
      it(`correctly handles OperationType.${op} with value "${expectedStr}"`, () => {
        try {
          handleFirestoreError(new Error(`Test error for ${op}`), op, `test/${op}`);
        } catch (err: any) {
          const parsed = JSON.parse(err.message);
          expect(parsed.operationType).toBe(expectedStr);
          expect(parsed.path).toBe(`test/${op}`);
        }
      });
    });
  });
});
