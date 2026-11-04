import test, { after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { handleFirestoreError, OperationType, auth, db } from './firebase';
import { terminate } from 'firebase/firestore';

// Suppress console.error during tests
const originalConsoleError = console.error;
console.error = () => {};

// Mock auth.currentUser properly to avoid Firebase internal assertion errors during termination
const createMockUser = (data: any) => ({
  ...data,
  getIdToken: async () => 'mock-token',
  _stopProactiveRefresh: () => {},
});

after(async () => {
  console.error = originalConsoleError;
  await terminate(db).catch(() => {});
});

afterEach(() => {
    Object.defineProperty(auth, 'currentUser', { value: null, configurable: true });
});

beforeEach(() => {
  Object.defineProperty(auth, 'currentUser', { value: null, configurable: true });
});

test('handleFirestoreError standard Error with complete currentUser', () => {
  const mockUser = createMockUser({
    uid: 'user123',
    email: 'test@example.com',
    emailVerified: true,
    isAnonymous: false,
    tenantId: 'tenant456',
    providerData: [
      {
        providerId: 'google.com',
        displayName: 'Test User',
        email: 'test@example.com',
        photoURL: 'http://example.com/photo.jpg'
      }
    ]
  });
  Object.defineProperty(auth, 'currentUser', { get: () => mockUser, configurable: true });

  const error = new Error('Permission denied');

  assert.throws(() => {
    handleFirestoreError(error, OperationType.GET, 'collection/doc'); // NOTE: Changed OperationType.READ to OperationType.GET as READ is not in the enum
  }, (err: any) => {
    const errInfo = JSON.parse(err.message);
    assert.strictEqual(errInfo.error, 'Permission denied');
    assert.strictEqual(errInfo.operationType, OperationType.GET);
    assert.strictEqual(errInfo.path, 'collection/doc');
    assert.strictEqual(errInfo.authInfo.userId, 'user123');
    assert.strictEqual(errInfo.authInfo.email, 'test@example.com');
    assert.strictEqual(errInfo.authInfo.providerInfo.length, 1);
    assert.strictEqual(errInfo.authInfo.providerInfo[0].providerId, 'google.com');
    return true;
  });
});

test('handleFirestoreError standard Error with null currentUser', () => {
  const error = 'Some string error';

  assert.throws(() => {
    handleFirestoreError(error, OperationType.CREATE, null);
  }, (err: any) => {
    const errInfo = JSON.parse(err.message);
    assert.strictEqual(errInfo.error, 'Some string error');
    assert.strictEqual(errInfo.operationType, OperationType.CREATE);
    assert.strictEqual(errInfo.path, null);
    assert.strictEqual(errInfo.authInfo.userId, undefined);
    assert.deepStrictEqual(errInfo.authInfo.providerInfo, []);
    return true;
  });
});

test('handleFirestoreError standard Error with missing providerData', () => {
  const mockUser = createMockUser({
    uid: 'user123',
  });
  Object.defineProperty(auth, 'currentUser', { get: () => mockUser, configurable: true });

  const error = new Error('Not found');

  assert.throws(() => {
    handleFirestoreError(error, OperationType.GET, 'path/id');
  }, (err: any) => {
    const errInfo = JSON.parse(err.message);
    assert.strictEqual(errInfo.error, 'Not found');
    assert.strictEqual(errInfo.authInfo.userId, 'user123');
    assert.deepStrictEqual(errInfo.authInfo.providerInfo, []);
    return true;
  });
});
