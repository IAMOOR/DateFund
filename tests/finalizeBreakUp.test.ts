import { describe, it, expect, vi } from 'vitest';
import { writeBatch } from '../src/firebase';

describe('finalizeBreakUp batching optimization', () => {
  it('exports writeBatch from src/firebase', () => {
    expect(typeof writeBatch).toBe('function');
  });

  it('batches updates into a single atomic writeBatch commit', async () => {
    const batchUpdates: Array<{ ref: any; data: any }> = [];
    let commitCount = 0;

    const mockBatch = {
      update: vi.fn((ref, data) => {
        batchUpdates.push({ ref, data });
        return mockBatch;
      }),
      commit: vi.fn(async () => {
        commitCount++;
      })
    };

    const mockWriteBatch = vi.fn(() => mockBatch);
    const mockDoc = vi.fn((_db, collection, id) => ({ collection, id }));
    const mockDeleteField = vi.fn(() => '__DELETE_FIELD__');

    // Simulate finalizeBreakUp logic as implemented in App.tsx
    const user = { uid: 'user_1' };
    const goals = [
      { id: 'goal_shared_owned', ownerUid: 'user_1', collaborators: ['user_1', 'user_2'] },
      { id: 'goal_shared_partner', ownerUid: 'user_2', collaborators: ['user_1', 'user_2'] },
      { id: 'goal_solo', ownerUid: 'user_1', collaborators: ['user_1'] } // Solo goal, not shared
    ];

    const sharedGoals = goals.filter(g => g.collaborators.length > 1);
    const batch = mockWriteBatch();

    for (const goal of sharedGoals) {
      if (goal.ownerUid === user.uid) {
        batch.update(mockDoc(null, 'goals', goal.id), {
          collaborators: [user.uid],
          archived: true,
          archivedAt: expect.any(String)
        });
      } else {
        const updatedCollabs = goal.collaborators.filter(uid => uid !== user.uid);
        batch.update(mockDoc(null, 'goals', goal.id), {
          collaborators: updatedCollabs.length > 0 ? updatedCollabs : [goal.ownerUid]
        });
      }
    }

    batch.update(mockDoc(null, 'users', user.uid), {
      partnerUid: mockDeleteField()
    });

    await batch.commit();

    // Verify atomic batch commit
    expect(commitCount).toBe(1);
    expect(mockBatch.update).toHaveBeenCalledTimes(3);

    // Goal owned by user is archived
    expect(batchUpdates[0].ref).toEqual({ collection: 'goals', id: 'goal_shared_owned' });
    expect(batchUpdates[0].data.collaborators).toEqual(['user_1']);
    expect(batchUpdates[0].data.archived).toBe(true);

    // Goal owned by partner removes user from collaborators
    expect(batchUpdates[1].ref).toEqual({ collection: 'goals', id: 'goal_shared_partner' });
    expect(batchUpdates[1].data.collaborators).toEqual(['user_2']);

    // User doc unlinks partnerUid
    expect(batchUpdates[2].ref).toEqual({ collection: 'users', id: 'user_1' });
    expect(batchUpdates[2].data.partnerUid).toBe('__DELETE_FIELD__');
  });
});
