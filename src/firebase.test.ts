import { test, mock, after, describe } from 'node:test';
import assert from 'node:assert';
import { handleFirestoreError, OperationType, auth } from './firebase.ts';
import { deleteApp } from 'firebase/app';

describe('handleFirestoreError', () => {

    test('formats Error object correctly', () => {
        mock.method(console, 'error', () => {});

        assert.throws(
            () => {
                handleFirestoreError(new Error('permission denied'), OperationType.WRITE, 'users/123');
            },
            (err: Error) => {
                const parsed = JSON.parse(err.message);
                assert.strictEqual(parsed.error, 'permission denied');
                assert.strictEqual(parsed.operationType, 'write');
                assert.strictEqual(parsed.path, 'users/123');
                return true;
            }
        );

        mock.restoreAll();
    });

    test('formats unknown object correctly', () => {
        mock.method(console, 'error', () => {});

        assert.throws(
            () => {
                handleFirestoreError('unknown string error', OperationType.LIST, 'settings');
            },
            (err: Error) => {
                const parsed = JSON.parse(err.message);
                assert.strictEqual(parsed.error, 'unknown string error');
                assert.strictEqual(parsed.operationType, 'list');
                assert.strictEqual(parsed.path, 'settings');
                return true;
            }
        );

        mock.restoreAll();
    });

    test('includes authInfo when user is missing (defaults to undefined)', () => {
        mock.method(console, 'error', () => {});

        // At this point auth.currentUser is null/undefined in the test environment
        assert.throws(
            () => {
                handleFirestoreError(new Error('test no user'), OperationType.GET, 'items/123');
            },
            (err: Error) => {
                const parsed = JSON.parse(err.message);
                assert.strictEqual(parsed.authInfo.userId, undefined);
                assert.strictEqual(parsed.authInfo.email, undefined);
                assert.strictEqual(parsed.authInfo.isAnonymous, undefined);
                // Note: providerInfo has a fallback to [] in handleFirestoreError implementation
                assert.deepStrictEqual(parsed.authInfo.providerInfo, []);
                return true;
            }
        );

        mock.restoreAll();
    });

    test('includes authInfo when user is present', () => {
        mock.method(console, 'error', () => {});

        // Mock the auth.currentUser property
        Object.defineProperty(auth, 'currentUser', {
            get: () => ({
                uid: 'user123',
                email: 'test@example.com',
                emailVerified: true,
                isAnonymous: false,
                tenantId: 'tenant-123',
                providerData: [
                    {
                        providerId: 'google.com',
                        displayName: 'Test User',
                        email: 'test@example.com',
                        photoURL: 'http://example.com/photo.jpg'
                    }
                ]
            }),
            configurable: true
        });

        assert.throws(
            () => {
                handleFirestoreError(new Error('test with user'), OperationType.CREATE, 'docs/1');
            },
            (err: Error) => {
                const parsed = JSON.parse(err.message);
                assert.strictEqual(parsed.authInfo.userId, 'user123');
                assert.strictEqual(parsed.authInfo.email, 'test@example.com');
                assert.strictEqual(parsed.authInfo.emailVerified, true);
                assert.strictEqual(parsed.authInfo.isAnonymous, false);
                assert.strictEqual(parsed.authInfo.tenantId, 'tenant-123');
                assert.strictEqual(parsed.authInfo.providerInfo.length, 1);
                assert.strictEqual(parsed.authInfo.providerInfo[0].providerId, 'google.com');
                assert.strictEqual(parsed.authInfo.providerInfo[0].displayName, 'Test User');
                assert.strictEqual(parsed.authInfo.providerInfo[0].photoUrl, 'http://example.com/photo.jpg');
                return true;
            }
        );

        // Restore
        Object.defineProperty(auth, 'currentUser', {
            get: () => null,
            configurable: true
        });

        mock.restoreAll();
    });
});

after(() => {
    deleteApp(auth.app);
});
