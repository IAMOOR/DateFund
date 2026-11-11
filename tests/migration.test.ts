import { describe, it, expect, vi } from 'vitest';

/**
 * Encapsulated migration runner modeling the logic from src/App.tsx fixOldData
 */
export async function runGoalsMigration(
  db: any,
  user: { uid: string },
  getDocsFn: (q: any) => Promise<{ docs: Array<{ id: string; data: () => any }> }>,
  writeBatchFn: (db: any) => any,
  queryFn: (...args: any[]) => any,
  collectionFn: (db: any, name: string) => any,
  whereFn: (field: string, op: string, val: any) => any,
  docFn: (db: any, coll: string, id: string) => any
) {
  const qGoals = queryFn(collectionFn(db, 'goals'), whereFn('ownerUid', '==', user.uid));
  const snapGoals = await getDocsFn(qGoals);
  let goalBatch = writeBatchFn(db);
  let goalBatchCount = 0;

  for (const docSnap of snapGoals.docs) {
    const data = docSnap.data();
    if (!data.collaborators || !Array.isArray(data.collaborators) || data.collaborators.length === 0) {
      goalBatch.set(docFn(db, 'goals', docSnap.id), {
        ...data,
        collaborators: [user.uid]
      }, { merge: true });
      goalBatchCount++;

      if (goalBatchCount === 500) {
        await goalBatch.commit();
        goalBatch = writeBatchFn(db);
        goalBatchCount = 0;
      }
    }
  }
  if (goalBatchCount > 0) {
    await goalBatch.commit();
  }
}

describe('Goals Migration & writeBatch Optimization', () => {
  it('updates owned goals missing collaborators list to include [user.uid]', async () => {
    const setCalls: any[] = [];
    const commitCalls: any[] = [];

    const mockBatch = {
      set: vi.fn((ref, data, opts) => setCalls.push({ ref, data, opts })),
      commit: vi.fn(async () => { commitCalls.push(true); })
    };

    const mockDocs = [
      {
        id: 'goal_without_collab_1',
        data: () => ({
          ownerUid: 'user_123',
          name: 'Trip to Paris',
          targetAmount: 10000
        })
      },
      {
        id: 'goal_with_empty_collab',
        data: () => ({
          ownerUid: 'user_123',
          name: 'Dinner Date',
          targetAmount: 500,
          collaborators: []
        })
      }
    ];

    const getDocsFn = vi.fn(async () => ({ docs: mockDocs }));
    const writeBatchFn = vi.fn(() => mockBatch);
    const queryFn = vi.fn();
    const collectionFn = vi.fn();
    const whereFn = vi.fn();
    const docFn = vi.fn((_db, _coll, id) => `ref_${id}`);

    await runGoalsMigration(
      {} as any,
      { uid: 'user_123' },
      getDocsFn,
      writeBatchFn,
      queryFn,
      collectionFn,
      whereFn,
      docFn
    );

    expect(setCalls.length).toBe(2);
    expect(setCalls[0].ref).toBe('ref_goal_without_collab_1');
    expect(setCalls[0].data.collaborators).toEqual(['user_123']);
    expect(setCalls[0].opts).toEqual({ merge: true });

    expect(setCalls[1].ref).toBe('ref_goal_with_empty_collab');
    expect(setCalls[1].data.collaborators).toEqual(['user_123']);
    expect(setCalls[1].opts).toEqual({ merge: true });

    expect(commitCalls.length).toBe(1);
  });

  it('preserves goals that already have collaborators without queuing updates', async () => {
    const setCalls: any[] = [];
    const commitCalls: any[] = [];

    const mockBatch = {
      set: vi.fn((ref, data, opts) => setCalls.push({ ref, data, opts })),
      commit: vi.fn(async () => { commitCalls.push(true); })
    };

    const mockDocs = [
      {
        id: 'goal_already_has_collab',
        data: () => ({
          ownerUid: 'user_123',
          name: 'Wedding Savings',
          targetAmount: 20000,
          collaborators: ['user_123', 'user_456']
        })
      }
    ];

    const getDocsFn = vi.fn(async () => ({ docs: mockDocs }));
    const writeBatchFn = vi.fn(() => mockBatch);
    const queryFn = vi.fn();
    const collectionFn = vi.fn();
    const whereFn = vi.fn();
    const docFn = vi.fn();

    await runGoalsMigration(
      {} as any,
      { uid: 'user_123' },
      getDocsFn,
      writeBatchFn,
      queryFn,
      collectionFn,
      whereFn,
      docFn
    );

    expect(setCalls.length).toBe(0);
    expect(commitCalls.length).toBe(0);
  });

  it('does not commit when there are no goals needing migration (avoids empty commit)', async () => {
    const mockBatch = {
      set: vi.fn(),
      commit: vi.fn()
    };

    const getDocsFn = vi.fn(async () => ({ docs: [] }));
    const writeBatchFn = vi.fn(() => mockBatch);

    await runGoalsMigration(
      {} as any,
      { uid: 'user_123' },
      getDocsFn,
      writeBatchFn,
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn()
    );

    expect(mockBatch.set).not.toHaveBeenCalled();
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it('chunks batch commits when operation count exceeds 500 documents', async () => {
    const batches: Array<{ set: any; commit: any }> = [];

    const createMockBatch = () => {
      const b = {
        set: vi.fn(),
        commit: vi.fn(async () => {})
      };
      batches.push(b);
      return b;
    };

    const mockDocs = Array.from({ length: 505 }, (_, i) => ({
      id: `goal_${i}`,
      data: () => ({
        ownerUid: 'user_123',
        name: `Goal ${i}`,
        targetAmount: 100
      })
    }));

    const getDocsFn = vi.fn(async () => ({ docs: mockDocs }));
    const writeBatchFn = vi.fn(() => createMockBatch());

    await runGoalsMigration(
      {} as any,
      { uid: 'user_123' },
      getDocsFn,
      writeBatchFn,
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn((_db, _coll, id) => `ref_${id}`)
    );

    // Expect 2 batches created (first 500, then remaining 5)
    expect(batches.length).toBe(2);
    expect(batches[0].set).toHaveBeenCalledTimes(500);
    expect(batches[0].commit).toHaveBeenCalledTimes(1);

    expect(batches[1].set).toHaveBeenCalledTimes(5);
    expect(batches[1].commit).toHaveBeenCalledTimes(1);
  });
});
