import assert from 'node:assert';
import { describe, it, after } from 'node:test';
import { db, auth } from './firebase.js';
import { terminate } from 'firebase/firestore';

describe('Firebase Init', () => {
  after(async () => {
    console.error = () => {};
    Object.defineProperty(auth, 'currentUser', { get: () => ({ getIdToken: async () => 'mock-token', _stopProactiveRefresh: () => {} }) });
    await terminate(db);
  });

  it('should initialize successfully', () => {
    assert.ok(db);
    assert.ok(auth);
  });
});
