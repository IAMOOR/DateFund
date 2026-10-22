import { test, describe, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { handleFirestoreError, OperationType, auth, db } from './firebase.ts';
import { terminate } from 'firebase/firestore';

describe('handleFirestoreError', () => {
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = () => {}; // Suppress console.error during tests
  });

  after(async () => {
    console.error = originalConsoleError;
    await terminate(db);
  });

  test('formats Error objects correctly with null auth.currentUser', () => {
    Object.defineProperty(auth, 'currentUser', {
      get: () => null,
      configurable: true
    });

    const error = new Error('Test error message');

    assert.throws(
      () => handleFirestoreError(error, OperationType.GET, '/path/to/doc'),
      (err: Error) => {
        const parsed = JSON.parse(err.message);
        assert.strictEqual(parsed.error, 'Test error message');
        assert.strictEqual(parsed.operationType, 'get');
        assert.strictEqual(parsed.path, '/path/to/doc');
        assert.deepStrictEqual(parsed.authInfo, {
          providerInfo: []
        });
        return true;
      }
    );
  });

  test('formats string errors correctly with populated auth.currentUser', () => {
    Object.defineProperty(auth, 'currentUser', {
      get: () => ({
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
        }],
        getIdToken: async () => 'mock-token',
        _stopProactiveRefresh: () => {}
      }),
      configurable: true
    });

    assert.throws(
      () => handleFirestoreError('String error message', OperationType.WRITE, null),
      (err: Error) => {
        const parsed = JSON.parse(err.message);
        assert.strictEqual(parsed.error, 'String error message');
        assert.strictEqual(parsed.operationType, 'write');
        assert.strictEqual(parsed.path, null);
        assert.deepStrictEqual(parsed.authInfo, {
          userId: 'user123',
          email: 'test@example.com',
          emailVerified: true,
          isAnonymous: false,
          tenantId: 'tenant456',
          providerInfo: [{
            providerId: 'google.com',
            displayName: 'Test User',
            email: 'test@example.com',
            photoUrl: 'http://example.com/photo.jpg'
          }]
        });
        return true;
      }
    );
  });
});
