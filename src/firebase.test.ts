import { test, describe, beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert';
import { terminate } from 'firebase/firestore';
import { handleFirestoreError, OperationType, auth, db } from './firebase.js';

const originalConsoleError = console.error;

describe('handleFirestoreError', () => {
  beforeEach(() => {
    console.error = () => {};
  });

  afterEach(() => {
    Object.defineProperty(auth, 'currentUser', { get: () => null, configurable: true });
    console.error = originalConsoleError;
  });

  after(async () => {
    await terminate(db);
  });

  test('handles Error instance and unauthenticated user', () => {
    Object.defineProperty(auth, 'currentUser', { get: () => null, configurable: true });

    let caughtError: Error | null = null;
    try {
      handleFirestoreError(new Error('test error'), OperationType.CREATE, 'users/123');
    } catch (e) {
      caughtError = e as Error;
    }

    assert.ok(caughtError);
    const parsed = JSON.parse(caughtError.message);
    assert.strictEqual(parsed.error, 'test error');
    assert.strictEqual(parsed.operationType, 'create');
    assert.strictEqual(parsed.path, 'users/123');
    assert.strictEqual(parsed.authInfo.userId, undefined);
  });

  test('handles non-Error instance', () => {
    Object.defineProperty(auth, 'currentUser', { get: () => null, configurable: true });

    let caughtError: Error | null = null;
    try {
      handleFirestoreError('string error', OperationType.UPDATE, 'docs/1');
    } catch (e) {
      caughtError = e as Error;
    }

    assert.ok(caughtError);
    const parsed = JSON.parse(caughtError.message);
    assert.strictEqual(parsed.error, 'string error');
  });

  test('handles authenticated user with complete details', () => {
    const mockUser = {
      uid: 'user123',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: 'tenant1',
      providerData: [
        {
          providerId: 'google.com',
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: 'http://example.com/photo.jpg'
        }
      ]
    };

    Object.defineProperty(auth, 'currentUser', { get: () => mockUser, configurable: true });

    let caughtError: Error | null = null;
    try {
      handleFirestoreError(new Error('auth error'), OperationType.DELETE, 'items/2');
    } catch (e) {
      caughtError = e as Error;
    }

    assert.ok(caughtError);
    const parsed = JSON.parse(caughtError.message);
    assert.strictEqual(parsed.authInfo.userId, 'user123');
    assert.strictEqual(parsed.authInfo.email, 'test@example.com');
    assert.strictEqual(parsed.authInfo.emailVerified, true);
    assert.strictEqual(parsed.authInfo.isAnonymous, false);
    assert.strictEqual(parsed.authInfo.tenantId, 'tenant1');
    assert.strictEqual(parsed.authInfo.providerInfo.length, 1);
    assert.strictEqual(parsed.authInfo.providerInfo[0].providerId, 'google.com');
    assert.strictEqual(parsed.authInfo.providerInfo[0].displayName, 'Test User');
    assert.strictEqual(parsed.authInfo.providerInfo[0].photoUrl, 'http://example.com/photo.jpg');
  });

  test('handles authenticated user with empty providerData', () => {
    const mockUser = {
      uid: 'user123',
      providerData: []
    };

    Object.defineProperty(auth, 'currentUser', { get: () => mockUser, configurable: true });

    let caughtError: Error | null = null;
    try {
      handleFirestoreError(new Error('no provider'), OperationType.GET, null);
    } catch (e) {
      caughtError = e as Error;
    }

    assert.ok(caughtError);
    const parsed = JSON.parse(caughtError.message);
    assert.strictEqual(parsed.authInfo.providerInfo.length, 0);
  });
});
